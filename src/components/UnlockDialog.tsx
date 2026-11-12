import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Eye, EyeOff, KeyRound, LoaderCircle } from 'lucide-react';
import type { UnlockResult } from '../hooks/useEditor';
import { Modal } from './Modal';
import f from './form.module.css';

import { recordWrong, resetWrong } from '../lib/ban';

interface Props {
  open: boolean;
  onClose: () => void;
  onUnlock: (password: string) => Promise<UnlockResult>;
  /** Дві помилки поспіль — блок на добу */
  onBanned: (until: number) => void;
}

export function UnlockDialog({ open, onClose, onUnlock, onBanned }: Props) {
  const [pw, setPw] = useState('');
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const input = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setPw('');
      setError(null);
      window.setTimeout(() => input.current?.focus(), 50);
    }
  }, [open]);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!pw || busy) return;
    setBusy(true);
    setError(null);
    const res = await onUnlock(pw);
    setBusy(false);
    if (res.ok) {
      resetWrong();
      onClose();
      return;
    }
    if (res.message === 'Невірний пароль.') {
      const until = recordWrong();
      if (until) {
        onClose();
        onBanned(until);
        return;
      }
      setPw('');
      setError('Невірний пароль.');
      return;
    }
    resetWrong(); // пароль правильний, підвів лише зв'язок із GitHub
    setError(res.message);
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
            disabled={busy}
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
        <div className={f.actions}>
          <button type="button" className="btn" onClick={onClose}>
            Скасувати
          </button>
          <button type="submit" className="btn btn-primary" disabled={!pw || busy}>
            {busy ? <LoaderCircle size={17} className="spin" /> : null}
            {busy ? 'Перевіряю…' : 'Увійти'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
