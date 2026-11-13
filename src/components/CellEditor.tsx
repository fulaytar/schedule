import { useEffect, useMemo, useState } from 'react';
import { Trash2 } from 'lucide-react';
import type { CatKey, Cell, DayKey, Schedule } from '../types';
import { CAT_ORDER, CATS, DAYS } from '../lib/constants';
import { pretty } from '../lib/time';
import { CatIcon } from './CatIcon';
import { ICON_OPTIONS, iconOption } from '../lib/icons';
import { cellOn } from '../lib/calendar';
import { Modal } from './Modal';
import f from './form.module.css';
import s from './CellEditor.module.css';

export interface EditTarget {
  day: DayKey;
  slotId: string;
  /** конкретна дата цього дня на показаному тижні */
  date: Date;
}

/** once — лише цього дня, weekly — щотижня */
export type Repeat = 'once' | 'weekly';

const EVERY: Record<DayKey, string> = {
  mon: 'Щопонеділка',
  tue: 'Щовівторка',
  wed: 'Щосереди',
  thu: 'Щочетверга',
  fri: 'Щоп’ятниці',
  sat: 'Щосуботи',
  sun: 'Щонеділі',
};

interface Props {
  target: EditTarget | null;
  schedule: Schedule;
  /** чи це заняття скасоване саме на target.date */
  cancelled: boolean;
  onApply: (cell: Cell | null, cancelled: boolean, repeat: Repeat) => void;
  onClose: () => void;
}

export function CellEditor({ target, schedule, cancelled, onApply, onClose }: Props) {
  // що стоїть саме цієї дати: разове заняття або тижневе
  const current = target ? cellOn(schedule, target.date, target.slotId) : undefined;
  const slot = target ? schedule.slots.find((x) => x.id === target.slotId) : undefined;

  const [cat, setCat] = useState<CatKey>('math');
  const [title, setTitle] = useState('');
  const [time, setTime] = useState('');
  const [off, setOff] = useState(false);
  const [icon, setIcon] = useState<string | undefined>(undefined);
  // за замовчуванням зміна стосується лише цього дня
  const [repeat, setRepeat] = useState<Repeat>('once');

  useEffect(() => {
    if (!target) return;
    setCat(current?.cat ?? 'math');
    setTitle(current?.title ?? '');
    setTime(current?.time ?? '');
    setOff(cancelled);
    setIcon(current?.icon);
    setRepeat('once');
  }, [target, current, cancelled]);

  // Підказки: усі назви, які вже трапляються в цій категорії
  const suggestions = useMemo(() => {
    const set = new Set<string>();
    for (const { key } of DAYS)
      Object.values(schedule.cells[key] ?? {}).forEach((c) => c && c.cat === cat && set.add(c.title));
    return [...set].sort((a, b) => a.localeCompare(b, 'uk'));
  }, [schedule, cat]);

  const pickCat = (c: CatKey) => {
    if (!title || title === CATS[cat].defaultTitle || !suggestions.includes(title)) setTitle(CATS[c].defaultTitle);
    setCat(c);
  };

  const pickIcon = (key: string | undefined) => {
    setIcon(key);
    const opt = iconOption(key);
    if (opt?.title && !title.trim()) setTitle(opt.title);
    // гра — це дозвілля, а не урок
    if (opt?.title && (cat === 'math' || cat === 'geo' || cat === 'free')) setCat('fun');
  };

  const finalTitle = title.trim() || CATS[cat].defaultTitle;
  const canSave = finalTitle.length > 0;

  const apply = () => {
    if (!canSave) return;
    const cell: Cell = { cat, title: finalTitle };
    if (time && slot && time !== slot.start) cell.time = time;
    if (icon) cell.icon = icon;
    onApply(cell, cat === 'ind' && off, repeat);
  };

  const dayName = target ? DAYS.find((d) => d.key === target.day)!.full : '';
  const dateLabel = target ? target.date.toLocaleDateString('uk-UA', { day: 'numeric', month: 'long' }) : '';
  const subtitle = slot
    ? `${dayName}, ${dateLabel} · ${slot.num !== null ? `${slot.num} урок · ` : ''}${pretty(slot.start)}–${pretty(slot.end)}`
    : '';

  return (
    <Modal
      open={target !== null}
      onClose={onClose}
      title={current ? 'Змінити заняття' : 'Додати заняття'}
      subtitle={subtitle}
      footer={
        <>
          {current && (
            <button className="btn btn-danger" onClick={() => onApply(null, false, repeat)} style={{ marginRight: 'auto' }}>
              <Trash2 size={16} /> Прибрати
            </button>
          )}
          <button className="btn" onClick={onClose}>
            Скасувати
          </button>
          <button className="btn btn-primary" onClick={apply} disabled={!canSave}>
            Готово
          </button>
        </>
      }
    >
      <div className={f.form}>
        <span className={f.label}>Коли</span>
        <div className={s.repeat} role="radiogroup" aria-label="Повторення">
          <button
            type="button"
            role="radio"
            aria-checked={repeat === 'once'}
            className={`${s.rep} ${repeat === 'once' ? s.repOn : ''}`}
            onClick={() => setRepeat('once')}
          >
            <b>Лише {dateLabel}</b>
            <small>інші тижні без змін</small>
          </button>
          <button
            type="button"
            role="radio"
            aria-checked={repeat === 'weekly'}
            className={`${s.rep} ${repeat === 'weekly' ? s.repOn : ''}`}
            onClick={() => setRepeat('weekly')}
          >
            <b>{target ? EVERY[target.day] : ''}</b>
            <small>повторювати щотижня</small>
          </button>
        </div>

        <span className={f.label}>Що це</span>
        <div className={s.cats} role="radiogroup" aria-label="Вид заняття">
          {CAT_ORDER.map((c) => (
            <button
              key={c}
              role="radio"
              aria-checked={c === cat}
              className={`${s.cat} cat-${c} ${c === cat ? s.catOn : ''}`}
              onClick={() => pickCat(c)}
            >
              <CatIcon cat={c} size={15} />
              {CATS[c].label}
            </button>
          ))}
        </div>

        <label className={f.label} htmlFor="cell-title">
          Назва
        </label>
        <input
          id="cell-title"
          className={`${f.input} ${f.plain}`}
          autoComplete="off"
          placeholder={cat === 'ind' ? 'Ім’я учня' : cat === 'math' || cat === 'geo' ? 'Напр. 6-В Математика' : ''}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && apply()}
        />
        {suggestions.filter((t) => t !== title.trim()).length > 0 && (
          <div className={s.chips} aria-label="Швидкий вибір">
            {suggestions
              .filter((t) => t !== title.trim())
              .map((t) => (
                <button key={t} type="button" className={`${s.chip} cat-${cat}`} onClick={() => setTitle(t)}>
                  {t}
                </button>
              ))}
          </div>
        )}

        <span className={f.label}>
          Іконка <span className={f.optional}>— за бажанням</span>
        </span>
        <div className={s.icons} role="radiogroup" aria-label="Іконка">
          <button
            type="button"
            role="radio"
            aria-checked={!icon}
            title="Як у категорії"
            className={`${s.icon} cat-${cat} ${!icon ? s.iconOn : ''}`}
            onClick={() => pickIcon(undefined)}
          >
            <CatIcon cat={cat} size={18} />
          </button>
          {ICON_OPTIONS.map((o) => (
            <button
              key={o.key}
              type="button"
              role="radio"
              aria-checked={icon === o.key}
              title={o.label}
              aria-label={o.label}
              className={`${s.icon} cat-${cat} ${icon === o.key ? s.iconOn : ''}`}
              onClick={() => pickIcon(o.key)}
            >
              <CatIcon cat={cat} icon={o.key} size={18} />
            </button>
          ))}
        </div>

        <label className={f.label} htmlFor="cell-time">
          Точний початок <span className={f.optional}>— якщо не {slot ? pretty(slot.start) : ''}</span>
        </label>
        <div className={s.timeRow}>
          <input
            id="cell-time"
            type="time"
            className={`${f.input} ${f.plain} ${s.time}`}
            value={time}
            onChange={(e) => setTime(e.target.value)}
          />
          {time && (
            <button className="btn btn-ghost" onClick={() => setTime('')}>
              Очистити
            </button>
          )}
        </div>

        {current && cat === 'ind' && (
          <>
            <span className={f.label}>
              Цього дня
            </span>
            <label className={`${s.cancel} ${off ? s.cancelOn : ''}`}>
              <input type="checkbox" checked={off} onChange={(e) => setOff(e.target.checked)} />
              <span>
                <b>Заняття не відбулося</b>
                <small>Прибрати зі статистики й доходу</small>
              </span>
            </label>
          </>
        )}
      </div>
    </Modal>
  );
}
