import { LoaderCircle, LogOut, RotateCcw, Upload } from 'lucide-react';
import s from './SaveBar.module.css';

interface Props {
  changes: number;
  saving: boolean;
  onSave: () => void;
  onDiscard: () => void;
  onExit: () => void;
}

function changesLabel(n: number): string {
  if (n === 0) return 'Немає змін';
  const last = n % 10;
  const teen = n % 100 >= 11 && n % 100 <= 14;
  const word = !teen && last === 1 ? 'зміна' : !teen && last >= 2 && last <= 4 ? 'зміни' : 'змін';
  return `${n} ${word}`;
}

export function SaveBar({ changes, saving, onSave, onDiscard, onExit }: Props) {
  return (
    <div className={s.bar} role="region" aria-label="Збереження змін">
      <div className={s.status}>
        <span className={s.dot} />
        <div>
          <strong>Редагування</strong>
          <span className={s.count}>{changesLabel(changes)}</span>
        </div>
      </div>
      <div className={s.actions}>
        <button className="btn btn-ghost" onClick={onDiscard} disabled={changes === 0 || saving} title="Скасувати зміни">
          <RotateCcw size={16} />
          <span className={s.hideSm}>Скасувати</span>
        </button>
        <button className="btn btn-primary" onClick={onSave} disabled={changes === 0 || saving}>
          {saving ? <LoaderCircle size={16} className="spin" /> : <Upload size={16} />}
          {saving ? 'Зберігаю…' : 'Зберегти'}
        </button>
        <button className="btn btn-icon" onClick={onExit} disabled={saving} aria-label="Вийти з редагування" title="Вийти з редагування">
          <LogOut size={16} />
        </button>
      </div>
    </div>
  );
}
