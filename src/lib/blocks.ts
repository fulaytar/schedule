import type { Block, Cell, DayKey, Schedule, Slot } from '../types';

function same(a: Cell, b: Cell): boolean {
  return a.cat === b.cat && a.title === b.title && !a.time && !b.time;
}

/**
 * Збирає однакові сусідні слоти дня в блоки (напр. IT 15:00–18:00).
 * Не зливає через межу «уроки / після уроків».
 */
export function dayBlocks(schedule: Schedule, day: DayKey, slots: Slot[] = schedule.slots): Block[] {
  const cells = schedule.cells[day] ?? {};
  const blocks: Block[] = [];
  let prev: Slot | null = null;

  for (const slot of slots) {
    const cell = cells[slot.id];
    const last = blocks[blocks.length - 1];
    const sameSection = prev !== null && (prev.num === null) === (slot.num === null);
    const adjacent = last && prev && last.slotIds[last.slotIds.length - 1] === prev.id;

    if (cell && last && adjacent && sameSection && same(last.cell, cell)) {
      last.end = slot.end;
      last.slotIds.push(slot.id);
    } else if (cell) {
      blocks.push({ cell, start: cell.time ?? slot.start, end: slot.end, slotIds: [slot.id] });
    }
    prev = slot;
  }
  return blocks;
}
