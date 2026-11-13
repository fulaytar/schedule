import type { CatKey, Cell, DayKey, Schedule } from '../types';
import { dayKeyOf } from './constants';
import { dayBlocks } from './blocks';

export interface Period {
  name: string;
  start: string; // "2026-10-26"
  end: string; // включно
}

/** public/data/calendar.json — семестри й канікули навчального року */
export interface SchoolCalendar {
  year: string;
  terms: Period[];
  holidays: Period[];
  /** Що відпадає в канікули: уроки й «вікна». IT, заняття з учнями, зал лишаються. */
  schoolCategories: CatKey[];
  /** У дні без уроків IT починається о цій годині й іде до звичного кінця IT ("10:00") */
  offDayItFrom?: string;
}

export interface DayStatus {
  school: boolean;
  /** "Осінні канікули", "Літні канікули" … або null, якщо день навчальний */
  reason: string | null;
  /** До якої дати (включно) триває перерва, якщо відомо */
  until: string | null;
}

export const isoDate = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

export function fromIso(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
}

/** "2026-11-01" → "1.11" */
export const shortDate = (iso: string) => {
  const d = fromIso(iso);
  return `${d.getDate()}.${String(d.getMonth() + 1).padStart(2, '0')}`;
};

const within = (iso: string, p: Period) => p.start <= iso && iso <= p.end;

export function dayStatus(cal: SchoolCalendar | null, date: Date): DayStatus {
  if (!cal || cal.terms.length === 0) return { school: true, reason: null, until: null };
  const iso = isoDate(date);
  const holiday = cal.holidays.find((p) => within(iso, p));
  if (holiday) return { school: false, reason: holiday.name, until: holiday.end };
  if (cal.terms.some((t) => within(iso, t))) return { school: true, reason: null, until: null };

  const starts = cal.terms.map((t) => t.start).sort();
  const ends = cal.terms.map((t) => t.end).sort();
  if (iso > ends[ends.length - 1] || iso < starts[0]) {
    const next = iso < starts[0] ? starts[0] : null;
    return { school: false, reason: 'Літні канікули', until: next ? isoDate(new Date(fromIso(next).getTime() - 864e5)) : null };
  }
  const nextStart = starts.find((s) => s > iso) ?? null;
  return { school: false, reason: 'Канікули', until: nextStart ? isoDate(new Date(fromIso(nextStart).getTime() - 864e5)) : null };
}

const isSchoolCell = (cal: SchoolCalendar | null, cell: Cell | undefined) =>
  !!cell && !!cal && cal.schoolCategories.includes(cell.cat);

/**
 * Розклад дня без уроків (канікули, літо): прибрано уроки й вікна,
 * а IT іде суцільно з offDayItFrom (типово 10:00) до звичного кінця IT цього дня.
 * Зал і заняття з учнями лишаються на своїх місцях.
 */
export function withoutSchool(schedule: Schedule, cal: SchoolCalendar | null, day: DayKey): Schedule {
  const src = schedule.cells[day] ?? {};
  const cells: Record<string, Cell> = Object.fromEntries(
    Object.entries(src).filter(([, c]) => c && !isSchoolCell(cal, c)),
  ) as Record<string, Cell>;

  const from = cal?.offDayItFrom ?? '10:00';
  const itIdx = schedule.slots.map((sl, i) => (src[sl.id]?.cat === 'it' ? i : -1)).filter((i) => i >= 0);
  if (itIdx.length > 0) {
    const last = itIdx[itIdx.length - 1];
    const itCell = src[schedule.slots[last].id]!;
    schedule.slots.forEach((sl, i) => {
      if (sl.start < from) {
        if (cells[sl.id]?.cat === 'it') delete cells[sl.id];
      } else if (i <= last && !cells[sl.id]) {
        cells[sl.id] = { cat: 'it', title: itCell.title };
      }
    });
  }
  return { ...schedule, cells: { ...schedule.cells, [day]: cells } };
}

/* ---------- скасовані заняття ---------- */

export const cancelKey = (date: Date, slotId: string) => `${isoDate(date)}:${slotId}`;

export const isCancelled = (schedule: Schedule, date: Date, slotId: string) =>
  !!schedule.cancelled?.includes(cancelKey(date, slotId));

function cancelledSlots(schedule: Schedule, date: Date): Set<string> {
  const prefix = `${isoDate(date)}:`;
  return new Set((schedule.cancelled ?? []).filter((k) => k.startsWith(prefix)).map((k) => k.slice(prefix.length)));
}

/** Дати, на які є хоч одне скасування */
export const cancelledDates = (schedule: Schedule) => new Set((schedule.cancelled ?? []).map((k) => k.slice(0, 10)));

/** Для показу: скасовані заняття дня позначені cancelled: true */
export function markCancelled(schedule: Schedule, date: Date): Schedule {
  const off = cancelledSlots(schedule, date);
  if (off.size === 0) return schedule;
  const day = dayKeyOf(date);
  const cells = Object.fromEntries(
    Object.entries(schedule.cells[day] ?? {}).map(([id, c]) => [id, c && off.has(id) ? { ...c, cancelled: true } : c]),
  );
  return { ...schedule, cells: { ...schedule.cells, [day]: cells } };
}

function withoutCancelled(schedule: Schedule, date: Date): Schedule {
  const off = cancelledSlots(schedule, date);
  if (off.size === 0) return schedule;
  const day = dayKeyOf(date);
  const cells = Object.fromEntries(Object.entries(schedule.cells[day] ?? {}).filter(([id]) => !off.has(id)));
  return { ...schedule, cells: { ...schedule.cells, [day]: cells } };
}

/* ---------- разові зміни на конкретну дату ---------- */

/** Разові зміни цієї дати (slotId → клітинка або null) */
export const datedOn = (schedule: Schedule, date: Date) => schedule.dated?.[isoDate(date)];

/** Дати, на які є разові зміни */
export const datedDates = (schedule: Schedule) => new Set(Object.keys(schedule.dated ?? {}));

/** Розклад із разовими змінами цієї дати. mark — позначити разові клітинки (once) для показу */
export function withDated(schedule: Schedule, date: Date, mark = true): Schedule {
  const d = datedOn(schedule, date);
  if (!d) return schedule;
  const day = dayKeyOf(date);
  const cells = { ...(schedule.cells[day] ?? {}) };
  for (const [id, c] of Object.entries(d)) {
    if (c) cells[id] = mark ? { ...c, once: true } : c;
    else delete cells[id];
  }
  return { ...schedule, cells: { ...schedule.cells, [day]: cells } };
}

/** Що стоїть у клітинці саме цієї дати (тижнева або разова), для редагування */
export function cellOn(schedule: Schedule, date: Date, slotId: string): Cell | undefined {
  const d = datedOn(schedule, date);
  if (d && slotId in d) return d[slotId] ? { ...d[slotId]!, once: true } : undefined;
  return schedule.cells[dayKeyOf(date)]?.[slotId];
}

/** Розклад на конкретну дату: канікули, разові зміни, без скасованих занять */
export function scheduleOn(schedule: Schedule, cal: SchoolCalendar | null, date: Date): Schedule {
  const s = dayStatus(cal, date).school ? schedule : withoutSchool(schedule, cal, dayKeyOf(date));
  return withoutCancelled(withDated(s, date, false), date);
}

/** Для показу дня: канікули + разові зміни (позначені) + скасовані (позначені) */
export function displayOn(schedule: Schedule, cal: SchoolCalendar | null, date: Date): Schedule {
  const s = dayStatus(cal, date).school ? schedule : withoutSchool(schedule, cal, dayKeyOf(date));
  return markCancelled(withDated(s, date), date);
}

export const blocksOn = (schedule: Schedule, cal: SchoolCalendar | null, date: Date) =>
  dayBlocks(scheduleOn(schedule, cal, date), dayKeyOf(date));

/** Початок і кінець навчального року (перший і останній день семестрів) */
export function schoolYearRange(cal: SchoolCalendar | null): { start: Date; end: Date } | null {
  if (!cal || cal.terms.length === 0) return null;
  const starts = cal.terms.map((t) => t.start).sort();
  const ends = cal.terms.map((t) => t.end).sort();
  return { start: fromIso(starts[0]), end: fromIso(ends[ends.length - 1]) };
}

/** На скільки тижнів можна піти назад / вперед від поточного (поточний тиждень доступний завжди) */
export function weekOffsetBounds(cal: SchoolCalendar | null, now: Date): { min: number; max: number } {
  const range = schoolYearRange(cal);
  if (!range) return { min: -Infinity, max: Infinity };
  const monday = (d: Date) => weekDates(d).mon.getTime();
  const weeks = (d: Date) => Math.round((monday(d) - monday(now)) / (7 * 864e5));
  return { min: Math.min(0, weeks(range.start)), max: Math.max(0, weeks(range.end)) };
}

/** Дати тижня, у якому лежить дата, Пн → Нд */
export function weekDates(now: Date): Record<DayKey, Date> {
  const monday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - ((now.getDay() + 6) % 7));
  const keys: DayKey[] = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
  return Object.fromEntries(
    keys.map((k, i) => [k, new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + i)]),
  ) as Record<DayKey, Date>;
}

/** Канікули, що зачіпають місяць (для підпису в статистиці) */
export function periodsInMonth(cal: SchoolCalendar | null, year: number, month: number): string[] {
  if (!cal) return [];
  const first = isoDate(new Date(year, month, 1));
  const last = isoDate(new Date(year, month + 1, 0));
  const out = cal.holidays
    .filter((h) => h.start <= last && h.end >= first)
    .map((h) => `${h.name.toLowerCase()} ${shortDate(h.start)}–${shortDate(h.end)}`);
  const ends = cal.terms.map((t) => t.end).sort();
  const starts = cal.terms.map((t) => t.start).sort();
  if (ends.length && (last > ends[ends.length - 1] || first < starts[0])) out.push('літні канікули');
  return out;
}
