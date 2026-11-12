import { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { Schedule } from '../../types';
import type { UnlockResult } from '../../hooks/useEditor';
import { rangeStats } from '../../lib/stats';
import { fromIso, periodsInMonth, type SchoolCalendar } from '../../lib/calendar';
import { hoursLabel, MONTHS } from '../../lib/time';
import { Segmented } from '../Segmented';
import { StatTile } from './StatTile';
import { CategoryBars } from './CategoryBars';
import { WeekdayBars } from './WeekdayBars';
import { Earnings } from './Earnings';
import s from './stats.module.css';

type Mode = 'month' | 'year';

interface Props {
  schedule: Schedule;
  cal: SchoolCalendar | null;
  now: Date;
  /** Є лише в режимі змін */
  money: { price: number; savePrice: (price: number) => Promise<UnlockResult> } | null;
}

const MONTHS_GEN = ['січня', 'лютого', 'березня', 'квітня', 'травня', 'червня', 'липня', 'серпня', 'вересня', 'жовтня', 'листопада', 'грудня'];
const dayMonth = (d: Date) => `${d.getDate()} ${MONTHS_GEN[d.getMonth()]}`;
const ymIndex = (y: number, m: number) => y * 12 + m;

/** Межі навчального року для гортання: вересень … серпень */
function yearBounds(cal: SchoolCalendar | null, now: Date) {
  const starts = cal?.terms.map((t) => t.start).sort() ?? [];
  const start = starts.length
    ? fromIso(starts[0])
    : new Date(now.getMonth() >= 8 ? now.getFullYear() : now.getFullYear() - 1, 8, 1);
  const minYm = ymIndex(start.getFullYear(), start.getMonth());
  return { start, minYm, maxYm: ymIndex(start.getFullYear() + 1, 7) };
}

export function MonthStats({ schedule, cal, now, money }: Props) {
  const { start: yearStart, minYm, maxYm } = useMemo(() => yearBounds(cal, now), [cal, now]);
  const [mode, setMode] = useState<Mode>('month');
  const [ym, setYm] = useState(() => ({ y: now.getFullYear(), m: now.getMonth() }));

  // поточний місяць у межах навчального року
  const cur = Math.min(Math.max(ymIndex(ym.y, ym.m), minYm), maxYm);
  const y = Math.floor(cur / 12);
  const m = cur % 12;

  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const [from, to] =
    mode === 'month' ? [new Date(y, m, 1), new Date(y, m + 1, 0)] : [yearStart, today < yearStart ? yearStart : today];

  const st = useMemo(() => rangeStats(schedule, cal, from, to), [schedule, cal, from.getTime(), to.getTime()]); // eslint-disable-line react-hooks/exhaustive-deps

  // скільки занять уже минуло в межах вибраного періоду
  const doneTo = today < to ? today : to;
  const doneSessions = useMemo(() => {
    if (!money || mode === 'year' || doneTo < from || doneTo.getTime() === to.getTime()) return null;
    return rangeStats(schedule, cal, from, doneTo).sessions.ind;
  }, [money, mode, schedule, cal, from.getTime(), to.getTime(), doneTo.getTime()]); // eslint-disable-line react-hooks/exhaustive-deps

  const shift = (d: number) => {
    const n = Math.min(Math.max(cur + d, minYm), maxYm);
    setYm({ y: Math.floor(n / 12), m: n % 12 });
  };
  const isCurrent = y === now.getFullYear() && m === now.getMonth();
  const breaks = periodsInMonth(cal, y, m);
  const periodLabel = mode === 'month' ? `${MONTHS[m]} ${y}` : `З ${dayMonth(yearStart)} по ${dayMonth(to)}`;

  const note =
    mode === 'year'
      ? 'Канікули враховано. Минулі тижні пораховано за теперішнім розкладом.'
      : cal
        ? breaks.length
          ? `Враховано: ${breaks.join(', ')} — уроків немає, решта за розкладом.`
          : `За розкладом і календарем ${cal.year} н. р.`
        : 'За тижневим розкладом; канікули не враховано.';

  const noteFull = schedule.cancelled?.length ? `${note} Скасовані заняття не рахуються.` : note;

  return (
    <section className={`${s.card} card`} aria-labelledby="stats-title">
      <div className={s.head}>
        <div>
          <h2 id="stats-title" className={s.title}>
            Статистика
          </h2>
          <p className={s.note}>{noteFull}</p>
        </div>
        <div className={s.controls}>
          <Segmented<Mode>
            label="Період"
            value={mode}
            onChange={setMode}
            options={[
              { value: 'month', label: 'Місяць' },
              { value: 'year', label: 'З вересня' },
            ]}
          />
          {mode === 'month' ? (
            <div className={s.month}>
              <button className="btn btn-icon" onClick={() => shift(-1)} disabled={cur <= minYm} aria-label="Попередній місяць">
                <ChevronLeft size={18} />
              </button>
              <span className={s.monthName}>
                {MONTHS[m]} {y}
                {isCurrent && <span className={s.cur}>зараз</span>}
              </span>
              <button className="btn btn-icon" onClick={() => shift(1)} disabled={cur >= maxYm} aria-label="Наступний місяць">
                <ChevronRight size={18} />
              </button>
            </div>
          ) : (
            <span className={s.monthName}>{periodLabel}</span>
          )}
        </div>
      </div>

      <div className={s.tiles}>
        <StatTile label="Робочий час" value={hoursLabel(st.workMinutes)} hint="уроки, IT та заняття" accent />
        <StatTile
          label="Уроків у школі"
          value={String(st.lessons)}
          hint={st.schoolDays ? `${st.schoolDays} навчальних днів` : 'канікули'}
        />
        <StatTile label="Індивідуальних занять" value={String(st.sessions.ind)} hint={hoursLabel(st.minutes.ind)} />
        <StatTile label="Тренувань у залі" value={String(st.sessions.gym)} hint={hoursLabel(st.minutes.gym)} />
      </div>

      {money && (
        <Earnings
          periodLabel={periodLabel}
          sessions={st.sessions.ind}
          done={doneSessions}
          byTitle={st.indByTitle}
          price={money.price}
          onSavePrice={money.savePrice}
        />
      )}

      <div className={s.charts}>
        <CategoryBars minutes={st.minutes} />
        <WeekdayBars schedule={schedule} cal={cal} now={now} />
      </div>
    </section>
  );
}
