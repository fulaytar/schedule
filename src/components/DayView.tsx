import { useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import type { DayKey, Schedule } from '../types';
import { DAYS } from '../lib/constants';
import { dayBlocks } from '../lib/blocks';
import { dayWorkMinutes } from '../lib/stats';
import { hoursLabel, pretty, toMin } from '../lib/time';
import { CatPill } from './CatPill';
import { dayStatus, isCancelled, markCancelled, scheduleOn, shortDate, withoutSchool, type SchoolCalendar } from '../lib/calendar';
import s from './DayView.module.css';

interface Props {
  schedule: Schedule;
  cal: SchoolCalendar | null;
  week: Record<DayKey, Date>;
  /** null — показано не поточний тиждень */
  today: DayKey | null;
  nowMin: number;
  editing: boolean;
  onEdit: (day: DayKey, slotId: string) => void;
}

export function DayView({ schedule: full, cal, week, today, nowMin, editing, onEdit }: Props) {
  const [day, setDay] = useState<DayKey>(today ?? 'mon');
  useEffect(() => setDay(today ?? 'mon'), [today]);

  const isToday = day === today;
  const status = dayStatus(cal, week[day]);
  // У канікули уроків цього дня не показуємо (крім режиму редагування — там шаблон тижня)
  const schedule = !editing && !status.school ? withoutSchool(full, cal, day) : full;
  const blocks = dayBlocks(markCancelled(schedule, week[day]), day);
  // підсумок дня — без скасованих занять
  const real = scheduleOn(full, cal, week[day]);
  const lessons = real.slots.filter((sl) => {
    const c = real.cells[day]?.[sl.id];
    return c && (c.cat === 'math' || c.cat === 'geo') && sl.num !== null;
  }).length;
  const work = dayWorkMinutes(real, day);

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
          <span className={s.dateLabel}>
            {week[day].getDate()}.{String(week[day].getMonth() + 1).padStart(2, '0')}
          </span>
          {isToday && <span className={s.todayTag}>сьогодні</span>}
        </h3>
        <span className={s.meta}>
          {lessons > 0 && `${lessons} ${lessons === 1 ? 'урок' : lessons < 5 ? 'уроки' : 'уроків'} · `}
          {work > 0 ? `${hoursLabel(work)} роботи` : 'вихідний'}
        </span>
      </div>

      {!editing && !status.school && (
        <p className={s.holiday}>
          {status.reason}
          {status.until ? ` до ${shortDate(status.until)}` : ''} — уроків немає, решта за розкладом.
        </p>
      )}

      {editing ? (
        <ol className={s.list}>
          {schedule.slots.map((slot) => {
            const raw = schedule.cells[day]?.[slot.id];
            const cell = raw && isCancelled(full, week[day], slot.id) ? { ...raw, cancelled: true } : raw;
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
            const now = isToday && start <= nowMin && nowMin < end && !b.cell.cancelled;
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
