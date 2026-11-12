import { useMemo } from 'react';
import type { Block, Schedule } from '../types';
import { DAYS, dayKeyOf } from '../lib/constants';
import { blocksOn, dayStatus, shortDate, type SchoolCalendar } from '../lib/calendar';
import { nowMin, pretty, toMin } from '../lib/time';
import { CatPill } from './CatPill';
import s from './NowCard.module.css';

function inLabel(mins: number): string {
  if (mins < 60) return `через ${mins} хв`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m ? `через ${h} год ${m} хв` : `через ${h} год`;
}

interface Next {
  block: Block;
  dayLabel: string | null;
  inMins: number | null;
}

export function NowCard({ schedule, cal, now }: { schedule: Schedule; cal: SchoolCalendar | null; now: Date }) {
  const m = nowMin(now);
  const today = dayKeyOf(now);

  const { current, next } = useMemo(() => {
    const blocks = blocksOn(schedule, cal, now);
    const current = blocks.find((b) => toMin(b.start) <= m && m < toMin(b.end)) ?? null;
    let next: Next | null = null;
    const later = blocks.find((b) => toMin(b.start) > m && b.cell.cat !== 'free');
    if (later) next = { block: later, dayLabel: null, inMins: toMin(later.start) - m };
    else {
      for (let i = 1; i <= 7 && !next; i++) {
        const d = new Date(now);
        d.setDate(d.getDate() + i);
        const first = blocksOn(schedule, cal, d).find((b) => b.cell.cat !== 'free');
        if (first) {
          const name = DAYS.find((x) => x.key === dayKeyOf(d))!.full.toLowerCase();
          next = { block: first, dayLabel: i === 1 ? 'завтра' : name, inMins: null };
        }
      }
    }
    return { current, next };
  }, [schedule, cal, today, m, now]);

  const status = dayStatus(cal, now);

  const dateLabel = now.toLocaleDateString('uk-UA', { weekday: 'long', day: 'numeric', month: 'long' });
  const progress = current ? (m - toMin(current.start)) / (toMin(current.end) - toMin(current.start)) : 0;

  return (
    <section className={`${s.card} card`} aria-label="Зараз і далі">
      <div className={s.clock}>
        <div className={s.time}>{now.toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' })}</div>
        <div className={s.date}>{dateLabel}</div>
        {!status.school && (
          <div className={s.break}>
            {status.reason}
            {status.until ? ` · до ${shortDate(status.until)}` : ''}
          </div>
        )}
      </div>

      <div className={s.slot}>
        <div className={s.label}>
          <span className={`${s.live} ${current ? s.on : ''}`} /> Зараз
        </div>
        {current ? (
          <>
            <div className={`${s.chip} cat-${current.cell.cat}`}>
              <CatPill cell={current.cell} />
            </div>
            <div className={s.sub}>
              до {pretty(current.end)}
              <span className={s.bar}>
                <span style={{ width: `${Math.round(progress * 100)}%` }} />
              </span>
            </div>
          </>
        ) : (
          <div className={s.empty}>Вільний час</div>
        )}
      </div>

      <div className={s.slot}>
        <div className={s.label}>Далі</div>
        {next ? (
          <>
            <div className={`${s.chip} cat-${next.block.cell.cat}`}>
              <CatPill cell={next.block.cell} />
            </div>
            <div className={s.sub}>
              {next.dayLabel ? `${next.dayLabel} о ${pretty(next.block.start)}` : `о ${pretty(next.block.start)}`}
              {next.inMins !== null && <span className={s.muted}> · {inLabel(next.inMins)}</span>}
            </div>
          </>
        ) : (
          <div className={s.empty}>Нічого не заплановано</div>
        )}
      </div>
    </section>
  );
}
