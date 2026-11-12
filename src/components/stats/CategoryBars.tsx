import type { CatKey } from '../../types';
import { CATS } from '../../lib/constants';
import { hoursLabel } from '../../lib/time';
import { CatIcon } from '../CatIcon';
import s from './stats.module.css';

const SHOWN: CatKey[] = ['math', 'geo', 'it', 'ind', 'gym', 'fun'];

export function CategoryBars({ minutes }: { minutes: Record<CatKey, number> }) {
  const max = Math.max(1, ...SHOWN.map((c) => minutes[c]));
  return (
    <div className={s.chart}>
      <h3 className={s.chartTitle}>Години за видами</h3>
      <ul className={s.bars}>
        {SHOWN.map((c) => (
          <li key={c} className={`${s.barRow} cat-${c}`}>
            <span className={s.barLabel}>
              <CatIcon cat={c} size={14} />
              {CATS[c].label}
            </span>
            <span className={s.track}>
              <span className={s.fill} style={{ width: `${(minutes[c] / max) * 100}%` }} />
            </span>
            <span className={s.barValue}>{hoursLabel(minutes[c])}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
