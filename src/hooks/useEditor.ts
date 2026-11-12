import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Cell, DayKey, Schedule } from '../types';
import { loadSecret, seal, unlockSecret, unseal, type RepoAccess, type SealedBlob } from '../lib/crypto';
import { fetchRemote, getFile, putFile, saveRemote, GitHubError } from '../lib/github';
import { DAYS } from '../lib/constants';
import { cancelKey } from '../lib/calendar';

const IDLE_LOCK_MS = 30 * 60 * 1000;

/** Приватні налаштування: зашифровані паролем, поза сайтом (у корені репо) */
const PRIVATE_PATH = 'private/settings.json';
export interface PrivateSettings {
  /** Ціна одного індивідуального заняття, грн */
  price: number;
}
const DEFAULT_PRIVATE: PrivateSettings = { price: 300 };

const clone = (s: Schedule): Schedule => JSON.parse(JSON.stringify(s)) as Schedule;

function countChanges(a: Schedule, b: Schedule): number {
  const ca = new Set(a.cancelled ?? []);
  const cb = new Set(b.cancelled ?? []);
  let n = [...ca].filter((k) => !cb.has(k)).length + [...cb].filter((k) => !ca.has(k)).length;
  for (const { key } of DAYS) {
    const x = a.cells[key] ?? {};
    const y = b.cells[key] ?? {};
    const ids = new Set([...Object.keys(x), ...Object.keys(y)]);
    ids.forEach((id) => {
      if (JSON.stringify(x[id] ?? null) !== JSON.stringify(y[id] ?? null)) n++;
    });
  }
  return n;
}

/** Повідомлення, коли немає інтернету */
export const OFFLINE = 'Немає інтернету. Перевір підключення й спробуй ще раз.';

export type UnlockResult = { ok: true } | { ok: false; message: string };

/**
 * Режим редагування: пароль → розшифрований токен у пам'яті →
 * зміни в чернетці → коміт schedule.json у репозиторій.
 */
export function useEditor(schedule: Schedule | null, setSchedule: (s: Schedule) => void) {
  const [access, setAccess] = useState<RepoAccess | null>(null);
  const [key, setKey] = useState<CryptoKey | null>(null);
  const [priv, setPriv] = useState<PrivateSettings>(DEFAULT_PRIVATE);
  const [privSha, setPrivSha] = useState<string | null>(null);
  const [sha, setSha] = useState<string | null>(null);
  const [base, setBase] = useState<Schedule | null>(null);
  const [draft, setDraft] = useState<Schedule | null>(null);
  const [saving, setSaving] = useState(false);
  const lastActive = useRef(Date.now());

  const editing = access !== null && draft !== null;
  const changes = useMemo(() => (base && draft ? countChanges(base, draft) : 0), [base, draft]);

  const unlock = useCallback(
    async (password: string): Promise<UnlockResult> => {
      if (!navigator.onLine) return { ok: false, message: OFFLINE };
      let blob;
      try {
        blob = await loadSecret();
      } catch {
        return { ok: false, message: OFFLINE };
      }
      if (!blob) return { ok: false, message: 'Редагування ще не налаштоване: на сайті немає файла secret.json.' };
      let acc: RepoAccess;
      let k: CryptoKey;
      try {
        const u = await unlockSecret(blob, password);
        acc = u.access;
        k = u.key;
      } catch {
        return { ok: false, message: 'Невірний пароль.' };
      }
      try {
        const remote = await fetchRemote(acc);
        let settings = DEFAULT_PRIVATE;
        let settingsSha: string | null = null;
        const file = await getFile(acc, PRIVATE_PATH).catch(() => null);
        if (file) {
          settingsSha = file.sha;
          try {
            settings = { ...DEFAULT_PRIVATE, ...(await unseal<PrivateSettings>(k, JSON.parse(file.text) as SealedBlob)) };
          } catch {
            /* файл зашифровано іншим паролем — беремо типові значення */
          }
        }
        setKey(k);
        setPriv(settings);
        setPrivSha(settingsSha);
        setAccess(acc);
        setSha(remote.sha);
        setBase(remote.schedule);
        setDraft(clone(remote.schedule));
        setSchedule(remote.schedule);
        lastActive.current = Date.now();
        return { ok: true };
      } catch (e) {
        return { ok: false, message: e instanceof GitHubError ? e.message : OFFLINE };
      }
    },
    [setSchedule],
  );

  const lock = useCallback(() => {
    setAccess(null);
    setKey(null);
    setPriv(DEFAULT_PRIVATE);
    setPrivSha(null);
    setSha(null);
    setBase(null);
    setDraft(null);
  }, []);

  const setCell = useCallback((day: DayKey, slotId: string, cell: Cell | null) => {
    lastActive.current = Date.now();
    setDraft((d) => {
      if (!d) return d;
      const next = clone(d);
      const dayCells = { ...(next.cells[day] ?? {}) };
      if (cell) dayCells[slotId] = cell;
      else delete dayCells[slotId];
      next.cells[day] = dayCells;
      return next;
    });
  }, []);

  /** Позначити / зняти скасування заняття на конкретну дату */
  const setCancelled = useCallback((date: Date, slotId: string, on: boolean) => {
    lastActive.current = Date.now();
    const k = cancelKey(date, slotId);
    setDraft((d) => {
      if (!d) return d;
      const set = new Set(d.cancelled ?? []);
      if (on) set.add(k);
      else set.delete(k);
      const next = clone(d);
      next.cancelled = [...set].sort();
      if (next.cancelled.length === 0) delete next.cancelled;
      return next;
    });
  }, []);

  const discard = useCallback(() => base && setDraft(clone(base)), [base]);

  const save = useCallback(async (): Promise<UnlockResult> => {
    if (!access || !draft || !sha) return { ok: false, message: 'Спершу увійди в режим редагування.' };
    setSaving(true);
    try {
      const toSave: Schedule = { ...draft, updatedAt: new Date().toISOString() };
      const newSha = await saveRemote(access, toSave, sha);
      setSha(newSha);
      setBase(clone(toSave));
      setDraft(clone(toSave));
      setSchedule(toSave);
      return { ok: true };
    } catch (e) {
      return { ok: false, message: e instanceof GitHubError ? e.message : 'Немає інтернету. Зміни не втрачено — спробуй ще раз, коли з’явиться зв’язок.' };
    } finally {
      setSaving(false);
    }
  }, [access, draft, sha, setSchedule]);

  const savePrice = useCallback(
    async (price: number): Promise<UnlockResult> => {
      if (!access || !key) return { ok: false, message: 'Спершу увійди в режим змін.' };
      try {
        const next: PrivateSettings = { ...priv, price };
        const sealed = await seal(key, next);
        const sha = await putFile(access, PRIVATE_PATH, JSON.stringify(sealed, null, 2) + '\n', privSha, 'Оновлено приватні налаштування');
        setPrivSha(sha);
        setPriv(next);
        return { ok: true };
      } catch (e) {
        return { ok: false, message: e instanceof GitHubError ? e.message : OFFLINE };
      }
    },
    [access, key, priv, privSha],
  );

  // Автоматичне блокування після 30 хв без дій (якщо немає незбережених змін)
  useEffect(() => {
    if (!editing) return;
    const mark = () => (lastActive.current = Date.now());
    window.addEventListener('pointerdown', mark);
    window.addEventListener('keydown', mark);
    const t = window.setInterval(() => {
      if (Date.now() - lastActive.current > IDLE_LOCK_MS && changes === 0) lock();
    }, 30_000);
    return () => {
      window.removeEventListener('pointerdown', mark);
      window.removeEventListener('keydown', mark);
      window.clearInterval(t);
    };
  }, [editing, changes, lock]);

  // Попередження при закритті вкладки з незбереженими змінами
  useEffect(() => {
    if (changes === 0) return;
    const warn = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [changes]);

  return {
    editing,
    view: editing ? draft : schedule,
    changes,
    saving,
    unlock,
    lock,
    setCell,
    setCancelled,
    discard,
    save,
    /** Видно тільки в режимі змін */
    money: editing ? { price: priv.price, savePrice } : null,
  };
}
