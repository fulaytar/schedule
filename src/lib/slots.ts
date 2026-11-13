import type { Schedule, Slot } from '../types';
import { toMin } from './time';

/** До якої години можна заповнювати розклад */
const DAY_END = '24:00';

const hh = (m: number) => `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;

/**
 * Додає годинні слоти після останнього, аж до 24:00 (напр. 22:00–23:00, 23:00–24:00).
 * Старий розклад, де слоти закінчуються о 22:00, так само доповнюється.
 */
export function withSlotsToMidnight(schedule: Schedule): Schedule {
  const slots: Slot[] = [...schedule.slots];
  let last = slots[slots.length - 1];
  if (!last) return schedule;
  let n = slots.filter((s) => s.num === null).length;
  const end = toMin(DAY_END);
  let added = false;
  while (toMin(last.end) < end) {
    const start = toMin(last.end);
    n += 1;
    let id = `a${n}`;
    while (slots.some((s) => s.id === id)) id = `a${++n}`;
    last = { id, num: null, start: hh(start), end: hh(Math.min(start + 60, end)) };
    slots.push(last);
    added = true;
  }
  return added ? { ...schedule, slots } : schedule;
}
