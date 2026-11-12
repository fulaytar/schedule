import { useEffect } from 'react';
import { CircleCheck, TriangleAlert } from 'lucide-react';
import s from './Toast.module.css';

export interface ToastMsg {
  id: number;
  kind: 'ok' | 'err';
  text: string;
}

export function Toast({ toast, onDone }: { toast: ToastMsg | null; onDone: () => void }) {
  useEffect(() => {
    if (!toast) return;
    const t = window.setTimeout(onDone, toast.kind === 'err' ? 8000 : 5000);
    return () => window.clearTimeout(t);
  }, [toast, onDone]);

  if (!toast) return null;
  return (
    <div className={`${s.toast} ${toast.kind === 'err' ? s.err : s.ok}`} role="status" onClick={onDone}>
      {toast.kind === 'ok' ? <CircleCheck size={18} /> : <TriangleAlert size={18} />}
      <span>{toast.text}</span>
    </div>
  );
}
