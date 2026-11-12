import type { Cell } from '../types';
import { CatIcon } from './CatIcon';
import { pretty } from '../lib/time';
import s from './CatPill.module.css';

/** Кольорова мітка заняття: іконка + назва (+ точний час) */
export function CatPill({ cell, size = 'md' }: { cell: Cell; size?: 'sm' | 'md' }) {
  return (
    <span className={`${s.pill} ${s[size]} cat-${cell.cat}`}>
      <CatIcon cat={cell.cat} size={size === 'sm' ? 14 : 16} />
      <span className={s.title}>{cell.title}</span>
      {cell.time && <span className={s.time}>{pretty(cell.time)}</span>}
    </span>
  );
}
