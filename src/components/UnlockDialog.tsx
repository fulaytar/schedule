import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Eye, EyeOff, KeyRound, LoaderCircle } from 'lucide-react';
import type { UnlockResult } from '../hooks/useEditor';
import { Modal } from './Modal';
import f from './form.module.css';

const MAX_TRIES = 5;
const COOLDOWN_S = 30;

interface Props {
  open: boolean;
  onClose: () => void;
  onUnlock: (password: string) => Promise<UnlockResult>;
}

export function UnlockDialog({ open, onClose, onUnlock }: Props) {
  const [pw, setPw] = useState('');
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fails, setFails] = useState(0);
  const [wait, setWait] = useState(0);
  const input = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setPw('');
      setError(null);
      window.setTimeout(() => input.current?.focus(), 50);
    }
  }, [open]);

  useEffect(() => {
    if (wait <= 0) return;
    const t = window.setTimeout(() => setWait((w) => w - 1), 1000);
    return () => window.clearTimeout(t);
  }, [wait]);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!pw || busy || wait > 0) return;
    setBusy(true);
    setError(null);
    const res = await onUnlock(pw);
    setBusy(false);
    if (res.ok) {
      setFails(0);
      onClose();
      return;
    }
    setError(res.message);
    if (res.message === 'Невірний пароль.') {
      const n = fails + 1;
      setFails(n);
      if (n >= MAX_TRIES) {
        setWait(COOLDOWN_S);
        setFails(0);
      }
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Режим редагування"
      subtitle="Переглядати розклад можуть усі. Змінювати — лише з паролем."
    >
      <form className={f.form} onSubmit={submit}>
        <label className={f.label} htmlFor="unlock-password">
          Пароль
        </label>
        <div className={f.inputWrap}>
          <KeyRound size={17} className={f.lead} />
          <input
            ref={input}
            id="unlock-password"
            className={f.input}
            type={show ? 'text' : 'password'}
            autoComplete="current-password"
            value={pw}
            onChange={(e) => setPw(e.target.value)}
            disabled={busy || wait > 0}
          />
          <button
            type="button"
            className={f.trail}
            onClick={() => setShow((v) => !v)}
            aria-label={show ? 'Сховати пароль' : 'Показати пароль'}
          >
            {show ? <EyeOff size={17} /> : <Eye size={17} />}
          </button>
        </div>
        {error && <p className={f.error}>{error}</p>}
        {wait > 0 && <p className={f.error}>Забагато спроб. Зачекай {wait} с.</p>}
        <div className={f.actions}>
          <button type="button" className="btn" onClick={onClose}>
            Скасувати
          </button>
          <button type="submit" className="btn btn-primary" disabled={!pw || busy || wait > 0}>
            {busy ? <LoaderCircle size={17} className="spin" /> : null}
            {busy ? 'Перевіряю…' : 'Увійти'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
