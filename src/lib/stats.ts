import type { CatKey, DayKey, Schedule } from '../types';
import { CAT_ORDER, CATS, DAYS, dayKeyOf } from './constants';
import { dayBlocks } from './blocks';
import { cancelledDates, dayStatus, isoDate, scheduleOn, withoutSchool, type SchoolCalendar } from './calendar';
import { toMin } from './time';

export interface PeriodStats {
  minutes: Record<CatKey, number>;
  /** Кількість окремих занять (блоків) за категорією */
  sessions: Record<CatKey, number>;
  /** Кількість шкільних уроків (кожен слот рахується окремо) */
  lessons: number;
  workMinutes: number;
  /** Навчальні дні, коли за розкладом є уроки */
  schoolDays: number;
  /** Індивідуальні заняття по кожному учню */
  indByTitle: Record<string, number>;
}

const zero = <T extends string>(keys: readonly T[]) =>
  Object.fromEntries(keys.map((k) => [k, 0])) as Record<T, number>;

interface DayTotals {
  min: Record<CatKey, number>;
  ses: Record<CatKey, number>;
  lessons: number;
  ind: string[];
}

function totals(schedule: Schedule, day: DayKey): DayTotals {
  const min = zero(CAT_ORDER);
  const ses = zero(CAT_ORDER);
  let lessons = 0;
  const cells = schedule.cells[day] ?? {};
  for (const slot of schedule.slots) {
    const cell = cells[slot.id];
    if (!cell) continue;
    min[cell.cat] += toMin(slot.end) - toMin(slot.start);
    if ((cell.cat === 'math' || cell.cat === 'geo') && slot.num !== null) lessons += 1;
  }
  const ind: string[] = [];
  for (const b of dayBlocks(schedule, day)) {
    ses[b.cell.cat] += 1;
    if (b.cell.cat === 'ind') ind.push(b.cell.title);
  }
  return { min, ses, lessons, ind };
}

/**
 * Статистика за період (обидві дати включно): тижневий розклад,
 * накладений на реальні дати з урахуванням канікул.
 */
export function rangeStats(schedule: Schedule, cal: SchoolCalendar | null, from: Date, to: Date): PeriodStats {
  const minutes = zero(CAT_ORDER);
  const sessions = zero(CAT_ORDER);
  const indByTitle: Record<string, number> = {};
  let lessons = 0;
  let schoolDays = 0;

  const full = new Map<DayKey, DayTotals>();
  const off = new Map<DayKey, DayTotals>();
  for (const { key } of DAYS) {
    full.set(key, totals(schedule, key));
    off.set(key, totals(withoutSchool(schedule, cal, key), key));
  }

  const withCancels = cancelledDates(schedule);
  const end = new Date(to.getFullYear(), to.getMonth(), to.getDate());
  for (let d = new Date(from.getFullYear(), from.getMonth(), from.getDate()); d <= end; d.setDate(d.getDate() + 1)) {
    const key = dayKeyOf(d);
    const school = dayStatus(cal, d).school;
    const t = withCancels.has(isoDate(d))
      ? totals(scheduleOn(schedule, cal, d), key)
      : (school ? full : off).get(key)!;
    if (school && t.lessons > 0) schoolDays += 1;
    lessons += t.lessons;
    for (const c of CAT_ORDER) {
      minutes[c] += t.min[c];
      sessions[c] += t.ses[c];
    }
    for (const name of t.ind) indByTitle[name] = (indByTitle[name] ?? 0) + 1;
  }

  const workMinutes = CAT_ORDER.filter((c) => CATS[c].work).reduce((s, c) => s + minutes[c], 0);
  return { minutes, sessions, lessons, workMinutes, schoolDays, indByTitle };
}

export const monthStats = (schedule: Schedule, cal: SchoolCalendar | null, year: number, month: number) =>
  rangeStats(schedule, cal, new Date(year, month, 1), new Date(year, month + 1, 0));

/** Робочі хвилини одного дня тижневого шаблону */
export function dayWorkMinutes(schedule: Schedule, day: DayKey): number {
  const cells = schedule.cells[day] ?? {};
  return schedule.slots.reduce((sum, slot) => {
    const cell = cells[slot.id];
    return cell && CATS[cell.cat].work ? sum + toMin(slot.end) - toMin(slot.start) : sum;
  }, 0);
}
