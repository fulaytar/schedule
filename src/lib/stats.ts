import type { CatKey, DayKey, Schedule } from '../types';
import { CAT_ORDER, CATS, DAYS, dayKeyOf } from './constants';
import { dayBlocks } from './blocks';
import { toMin } from './time';

export interface MonthStats {
  minutes: Record<CatKey, number>;
  /** Кількість окремих занять (блоків) за категорією */
  sessions: Record<CatKey, number>;
  /** Кількість шкільних уроків (кожен слот рахується окремо) */
  lessons: number;
  workMinutes: number;
  daysCount: Record<DayKey, number>;
  weekdayMinutes: Record<DayKey, number>;
}

const zero = <T extends string>(keys: readonly T[]) =>
  Object.fromEntries(keys.map((k) => [k, 0])) as Record<T, number>;

export function monthStats(schedule: Schedule, year: number, month: number): MonthStats {
  const minutes = zero(CAT_ORDER);
  const sessions = zero(CAT_ORDER);
  const daysCount = zero(DAYS.map((d) => d.key));
  const weekdayMinutes = zero(DAYS.map((d) => d.key));
  let lessons = 0;

  // Тижневий шаблон: хвилини та заняття для кожного дня
  const perDay = new Map<DayKey, { min: Record<CatKey, number>; ses: Record<CatKey, number>; lessons: number }>();
  for (const { key } of DAYS) {
    const min = zero(CAT_ORDER);
    const ses = zero(CAT_ORDER);
    let les = 0;
    const cells = schedule.cells[key] ?? {};
    for (const slot of schedule.slots) {
      const cell = cells[slot.id];
      if (!cell) continue;
      min[cell.cat] += toMin(slot.end) - toMin(slot.start);
      if ((cell.cat === 'math' || cell.cat === 'geo') && slot.num !== null) les += 1;
    }
    for (const b of dayBlocks(schedule, key)) ses[b.cell.cat] += 1;
    perDay.set(key, { min, ses, lessons: les });
  }

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  for (let d = 1; d <= daysInMonth; d++) {
    const key = dayKeyOf(new Date(year, month, d));
    const t = perDay.get(key)!;
    daysCount[key] += 1;
    lessons += t.lessons;
    for (const c of CAT_ORDER) {
      minutes[c] += t.min[c];
      sessions[c] += t.ses[c];
      if (CATS[c].work) weekdayMinutes[key] += t.min[c];
    }
  }

  const workMinutes = CAT_ORDER.filter((c) => CATS[c].work).reduce((s, c) => s + minutes[c], 0);
  return { minutes, sessions, lessons, workMinutes, daysCount, weekdayMinutes };
}

/** Робочі хвилини одного дня тижневого шаблону */
export function dayWorkMinutes(schedule: Schedule, day: DayKey): number {
  const cells = schedule.cells[day] ?? {};
  return schedule.slots.reduce((sum, slot) => {
    const cell = cells[slot.id];
    return cell && CATS[cell.cat].work ? sum + toMin(slot.end) - toMin(slot.start) : sum;
  }, 0);
}
