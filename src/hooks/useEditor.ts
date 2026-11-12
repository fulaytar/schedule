import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Cell, DayKey, Schedule } from '../types';
import { loadSecret, unlockSecret, type RepoAccess } from '../lib/crypto';
import { fetchRemote, saveRemote, GitHubError } from '../lib/github';
import { DAYS } from '../lib/constants';

const IDLE_LOCK_MS = 30 * 60 * 1000;

const clone = (s: Schedule): Schedule => JSON.parse(JSON.stringify(s)) as Schedule;

function countChanges(a: Schedule, b: Schedule): number {
  let n = 0;
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

export type UnlockResult = { ok: true } | { ok: false; message: string };

/**
 * Режим редагування: пароль → розшифрований токен у пам'яті →
 * зміни в чернетці → коміт schedule.json у репозиторій.
 */
export function useEditor(schedule: Schedule | null, setSchedule: (s: Schedule) => void) {
  const [access, setAccess] = useState<RepoAccess | null>(null);
  const [sha, setSha] = useState<string | null>(null);
  const [base, setBase] = useState<Schedule | null>(null);
  const [draft, setDraft] = useState<Schedule | null>(null);
  const [saving, setSaving] = useState(false);
  const lastActive = useRef(Date.now());

  const editing = access !== null && draft !== null;
  const changes = useMemo(() => (base && draft ? countChanges(base, draft) : 0), [base, draft]);

  const unlock = useCallback(
    async (password: string): Promise<UnlockResult> => {
      const blob = await loadSecret();
      if (!blob) return { ok: false, message: 'Редагування ще не налаштоване: на сайті немає файла secret.json.' };
      let acc: RepoAccess;
      try {
        acc = await unlockSecret(blob, password);
      } catch {
        return { ok: false, message: 'Невірний пароль.' };
      }
      try {
        const remote = await fetchRemote(acc);
        setAccess(acc);
        setSha(remote.sha);
        setBase(remote.schedule);
        setDraft(clone(remote.schedule));
        setSchedule(remote.schedule);
        lastActive.current = Date.now();
        return { ok: true };
      } catch (e) {
        return { ok: false, message: e instanceof GitHubError ? e.message : 'Немає зв’язку з GitHub.' };
      }
    },
    [setSchedule],
  );

  const lock = useCallback(() => {
    setAccess(null);
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
      return { ok: false, message: e instanceof GitHubError ? e.message : 'Немає зв’язку з GitHub. Зміни не втрачено — спробуй ще раз.' };
    } finally {
      setSaving(false);
    }
  }, [access, draft, sha, setSchedule]);

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
    discard,
    save,
  };
}
