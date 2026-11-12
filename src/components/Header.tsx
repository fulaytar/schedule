import { CalendarDays, Lock, LockOpen, Moon, Sun } from 'lucide-react';
import type { Meta } from '../types';
import s from './Header.module.css';

interface Props {
  meta: Meta;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
  editing: boolean;
  onLockClick: () => void;
}

export function Header({ meta, theme, onToggleTheme, editing, onLockClick }: Props) {
  return (
    <header className={s.header}>
      <div className={s.brand}>
        <span className={s.mark} aria-hidden>
          <CalendarDays size={22} />
        </span>
        <div>
          <h1 className={s.title}>
            Розклад<span className={s.titleTail}> на тиждень</span>
          </h1>
          <p className={s.meta}>
            <span className={s.owner}>{meta.owner}</span>
            <span className={`${s.dot} ${s.ownerDot}`}>·</span>
            {meta.school}
            <span className={s.dot}>·</span>
            {meta.year}
          </p>
        </div>
      </div>
      <div className={s.actions}>
        <button
          className="btn btn-icon"
          onClick={onToggleTheme}
          aria-label={theme === 'dark' ? 'Світла тема' : 'Темна тема'}
          title={theme === 'dark' ? 'Світла тема' : 'Темна тема'}
        >
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </button>
        <button className={`btn ${editing ? 'btn-primary' : ''}`} onClick={onLockClick}>
          {editing ? <LockOpen size={17} /> : <Lock size={17} />}
          <span className={s.lockLabel}>{editing ? 'Редагування' : 'Змінити'}</span>
        </button>
      </div>
    </header>
  );
}
