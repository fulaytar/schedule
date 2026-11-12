import type { CSSProperties } from 'react';
import { Plus } from 'lucide-react';
import type { DayKey, Schedule, Slot } from '../types';
import { DAYS } from '../lib/constants';
import { dayBlocks } from '../lib/blocks';
import { pretty, toMin } from '../lib/time';
import { CatPill } from './CatPill';
import s from './WeekGrid.module.css';

interface Props {
  schedule: Schedule;
  today: DayKey;
  nowMin: number;
  editing: boolean;
  onEdit: (day: DayKey, slotId: string) => void;
}

type Row = { kind: 'slot'; slot: Slot } | { kind: 'sep' };

export function WeekGrid({ schedule, today, nowMin, editing, onEdit }: Props) {
  // У звичайному режимі ховаємо рядки, де за весь тиждень нічого немає
  const visible = schedule.slots.filter(
    (slot) => editing || DAYS.some(({ key }) => schedule.cells[key]?.[slot.id]),
  );

  const rows: Row[] = [];
  visible.forEach((slot, i) => {
    const prev = visible[i - 1];
    if (prev && prev.num !== null && slot.num === null) rows.push({ kind: 'sep' });
    rows.push({ kind: 'slot', slot });
  });

  const rowOf = new Map<string, number>();
  rows.forEach((r, i) => r.kind === 'slot' && rowOf.set(r.slot.id, i + 2));
  const lastRow = rows.length + 1;

  const template = ['auto', ...rows.map((r) => (r.kind === 'sep' ? '26px' : 'minmax(48px, auto)'))].join(' ');
  const isNowSlot = (slot: Slot) => toMin(slot.start) <= nowMin && nowMin < toMin(slot.end);

  return (
    <div className={s.scroll}>
      <div className={s.grid} style={{ gridTemplateRows: template } as CSSProperties}>
        <div className={s.corner}>Час</div>
        {DAYS.map((d, i) => (
          <div key={d.key} className={`${s.dayHead} ${d.key === today ? s.todayHead : ''}`} style={{ gridColumn: i + 2, gridRow: 1 }}>
            <span className={s.dayFull}>{d.full}</span>
            <span className={s.dayShort}>{d.short}</span>
            {d.key === today && <span className={s.todayTag}>сьогодні</span>}
          </div>
        ))}

        {/* підсвітка сьогоднішнього стовпця */}
        {DAYS.map((d, i) =>
          d.key === today ? (
            <div key="todaycol" className={s.todayCol} style={{ gridColumn: i + 2, gridRow: `1 / ${lastRow + 1}` }} />
          ) : null,
        )}

        {rows.map((r, i) =>
          r.kind === 'sep' ? (
            <div key={`sep${i}`} className={s.sep} style={{ gridRow: i + 2 }}>
              <span>Після уроків</span>
            </div>
          ) : (
            <div
              key={r.slot.id}
              className={`${s.time} ${isNowSlot(r.slot) ? s.timeNow : ''}`}
              style={{ gridRow: i + 2 }}
            >
              {r.slot.num !== null && <span className={s.num}>{r.slot.num}</span>}
              <span>
                {pretty(r.slot.start)}
                <span className={s.dash}>–</span>
                {pretty(r.slot.end)}
              </span>
            </div>
          ),
        )}

        {DAYS.map((d, di) => {
          const col = di + 2;
          if (editing) {
            return visible.map((slot) => {
              const cell = schedule.cells[d.key]?.[slot.id];
              return (
                <button
                  key={`${d.key}-${slot.id}`}
                  className={`${s.cell} ${s.editable} ${cell ? `cat-${cell.cat} ${s.filled}` : s.empty}`}
                  style={{ gridColumn: col, gridRow: rowOf.get(slot.id) }}
                  onClick={() => onEdit(d.key, slot.id)}
                  aria-label={`${d.full}, ${pretty(slot.start)}: ${cell ? cell.title : 'додати'}`}
                >
                  {cell ? <CatPill cell={cell} size="sm" /> : <Plus size={16} />}
                </button>
              );
            });
          }

          const blocks = dayBlocks(schedule, d.key);
          const taken = new Set(blocks.flatMap((b) => b.slotIds));
          const items = blocks.map((b) => {
            const from = rowOf.get(b.slotIds[0])!;
            const to = rowOf.get(b.slotIds[b.slotIds.length - 1])!;
            const now = d.key === today && toMin(b.start) <= nowMin && nowMin < toMin(b.end);
            return (
              <div
                key={`${d.key}-${b.slotIds[0]}`}
                className={`${s.cell} ${s.filled} cat-${b.cell.cat} ${now ? s.now : ''}`}
                style={{ gridColumn: col, gridRow: `${from} / ${to + 1}` }}
              >
                <CatPill cell={b.cell} size="sm" />
                {b.slotIds.length > 1 && (
                  <span className={s.range}>
                    {pretty(b.start)}–{pretty(b.end)}
                  </span>
                )}
              </div>
            );
          });
          const blanks = visible
            .filter((slot) => !taken.has(slot.id))
            .map((slot) => (
              <div
                key={`${d.key}-${slot.id}-x`}
                className={`${s.cell} ${s.blank}`}
                style={{ gridColumn: col, gridRow: rowOf.get(slot.id) }}
              />
            ));
          return [...items, ...blanks];
        })}
      </div>
    </div>
  );
}
