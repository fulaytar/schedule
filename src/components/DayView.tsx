import { useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import type { DayKey, Schedule } from '../types';
import { DAYS } from '../lib/constants';
import { dayBlocks } from '../lib/blocks';
import { dayWorkMinutes } from '../lib/stats';
import { hoursLabel, pretty, toMin } from '../lib/time';
import { CatPill } from './CatPill';
import s from './DayView.module.css';

interface Props {
  schedule: Schedule;
  today: DayKey;
  nowMin: number;
  editing: boolean;
  onEdit: (day: DayKey, slotId: string) => void;
}

export function DayView({ schedule, today, nowMin, editing, onEdit }: Props) {
  const [day, setDay] = useState<DayKey>(today);
  useEffect(() => setDay(today), [today]);

  const isToday = day === today;
  const blocks = dayBlocks(schedule, day);
  const lessons = schedule.slots.filter((sl) => {
    const c = schedule.cells[day]?.[sl.id];
    return c && (c.cat === 'math' || c.cat === 'geo') && sl.num !== null;
  }).length;
  const work = dayWorkMinutes(schedule, day);

  return (
    <div className={s.wrap}>
      <div className={s.days} role="tablist" aria-label="День тижня">
        {DAYS.map((d) => (
          <button
            key={d.key}
            role="tab"
            aria-selected={d.key === day}
            className={`${s.day} ${d.key === day ? s.active : ''}`}
            onClick={() => setDay(d.key)}
          >
            <span>{d.short}</span>
            {d.key === today && <span className={s.todayDot} aria-label="сьогодні" />}
          </button>
        ))}
      </div>

      <div className={s.summary}>
        <h3 className={s.dayName}>
          {DAYS.find((d) => d.key === day)!.full}
          {isToday && <span className={s.todayTag}>сьогодні</span>}
        </h3>
        <span className={s.meta}>
          {lessons > 0 && `${lessons} ${lessons === 1 ? 'урок' : lessons < 5 ? 'уроки' : 'уроків'} · `}
          {work > 0 ? `${hoursLabel(work)} роботи` : 'вихідний'}
        </span>
      </div>

      {editing ? (
        <ol className={s.list}>
          {schedule.slots.map((slot) => {
            const cell = schedule.cells[day]?.[slot.id];
            return (
              <li key={slot.id} className={s.row}>
                <div className={s.time}>
                  <span>{pretty(slot.start)}</span>
                  <span className={s.end}>{pretty(slot.end)}</span>
                </div>
                <button
                  className={`${s.item} ${s.editable} ${cell ? `cat-${cell.cat}` : s.add}`}
                  onClick={() => onEdit(day, slot.id)}
                >
                  {cell ? <CatPill cell={cell} /> : (<><Plus size={16} /> Додати</>)}
                  {slot.num !== null && <span className={s.lessonNo}>{slot.num} урок</span>}
                </button>
              </li>
            );
          })}
        </ol>
      ) : blocks.length === 0 ? (
        <p className={s.free}>Нічого не заплановано — вільний день.</p>
      ) : (
        <ol className={s.list}>
          {blocks.map((b) => {
            const start = toMin(b.start);
            const end = toMin(b.end);
            const now = isToday && start <= nowMin && nowMin < end;
            const past = isToday && end <= nowMin;
            const first = schedule.slots.find((x) => x.id === b.slotIds[0]);
            const last = schedule.slots.find((x) => x.id === b.slotIds[b.slotIds.length - 1]);
            const nums =
              first?.num != null
                ? first.num === last?.num
                  ? `${first.num} урок`
                  : `${first.num}–${last?.num} урок`
                : null;
            return (
              <li key={b.slotIds[0]} className={`${s.row} ${past ? s.past : ''}`}>
                <div className={s.time}>
                  <span>{pretty(b.start)}</span>
                  <span className={s.end}>{pretty(b.end)}</span>
                </div>
                <div className={`${s.item} cat-${b.cell.cat} ${now ? s.now : ''}`}>
                  <CatPill cell={b.cell} />
                  <span className={s.right}>
                    {now && <span className={s.nowTag}>зараз</span>}
                    {nums && <span className={s.lessonNo}>{nums}</span>}
                  </span>
                  {now && (
                    <span className={s.progress}>
                      <span style={{ width: `${Math.round(((nowMin - start) / (end - start)) * 100)}%` }} />
                    </span>
                  )}
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}
