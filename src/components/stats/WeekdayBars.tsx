import type { Schedule } from '../../types';
import { DAYS, dayKeyOf } from '../../lib/constants';
import { dayWorkMinutes } from '../../lib/stats';
import s from './stats.module.css';

/** Робочі години в кожен день тижня (за шаблоном) */
export function WeekdayBars({ schedule, now }: { schedule: Schedule; now: Date }) {
  const today = dayKeyOf(now);
  const data = DAYS.map((d) => ({ ...d, min: dayWorkMinutes(schedule, d.key) }));
  const max = Math.max(60, ...data.map((d) => d.min));
  return (
    <div className={s.chart}>
      <h3 className={s.chartTitle}>Навантаження по днях</h3>
      <div className={s.cols}>
        {data.map((d) => (
          <div key={d.key} className={`${s.col} ${d.key === today ? s.colToday : ''}`}>
            <span className={s.colValue}>{d.min ? String(Math.round((d.min / 60) * 10) / 10).replace('.', ',') : '—'}</span>
            <span className={s.colTrack}>
              <span className={s.colFill} style={{ height: `${(d.min / max) * 100}%` }} />
            </span>
            <span className={s.colLabel}>{d.short}</span>
          </div>
        ))}
      </div>
      <p className={s.unit}>годин роботи на день</p>
    </div>
  );
}
