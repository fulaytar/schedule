import { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { Schedule } from '../../types';
import { monthStats } from '../../lib/stats';
import { hoursLabel, MONTHS } from '../../lib/time';
import { StatTile } from './StatTile';
import { CategoryBars } from './CategoryBars';
import { WeekdayBars } from './WeekdayBars';
import s from './stats.module.css';

export function MonthStats({ schedule, now }: { schedule: Schedule; now: Date }) {
  const [ym, setYm] = useState(() => ({ y: now.getFullYear(), m: now.getMonth() }));
  const st = useMemo(() => monthStats(schedule, ym.y, ym.m), [schedule, ym]);

  const shift = (d: number) =>
    setYm(({ y, m }) => {
      const n = new Date(y, m + d, 1);
      return { y: n.getFullYear(), m: n.getMonth() };
    });
  const isCurrent = ym.y === now.getFullYear() && ym.m === now.getMonth();

  return (
    <section className={`${s.card} card`} aria-labelledby="stats-title">
      <div className={s.head}>
        <div>
          <h2 id="stats-title" className={s.title}>
            Статистика за місяць
          </h2>
          <p className={s.note}>За тижневим розкладом; канікули й свята не враховано.</p>
        </div>
        <div className={s.month}>
          <button className="btn btn-icon" onClick={() => shift(-1)} aria-label="Попередній місяць">
            <ChevronLeft size={18} />
          </button>
          <span className={s.monthName}>
            {MONTHS[ym.m]} {ym.y}
            {isCurrent && <span className={s.cur}>зараз</span>}
          </span>
          <button className="btn btn-icon" onClick={() => shift(1)} aria-label="Наступний місяць">
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      <div className={s.tiles}>
        <StatTile label="Робочий час" value={hoursLabel(st.workMinutes)} hint="уроки, IT та заняття" accent />
        <StatTile label="Уроків у школі" value={String(st.lessons)} hint="математика й географія" />
        <StatTile label="Індивідуальних занять" value={String(st.sessions.ind)} hint={hoursLabel(st.minutes.ind)} />
        <StatTile label="Тренувань у залі" value={String(st.sessions.gym)} hint={hoursLabel(st.minutes.gym)} />
      </div>

      <div className={s.charts}>
        <CategoryBars minutes={st.minutes} />
        <WeekdayBars schedule={schedule} now={now} />
      </div>
    </section>
  );
}
