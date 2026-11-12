export type CatKey = 'math' | 'geo' | 'it' | 'ind' | 'gym' | 'fun' | 'free';
export type DayKey = 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun';

export interface Slot {
  id: string;
  /** Номер уроку за розкладом дзвінків; null — час після уроків */
  num: number | null;
  start: string; // "08:10"
  end: string; // "08:55"
}

export interface Cell {
  cat: CatKey;
  title: string;
  /** Точний час, якщо він не збігається з початком слота (напр. "20:30") */
  time?: string;
  /** Своя іконка замість іконки категорії (див. lib/icons.tsx) */
  icon?: string;
  /** Лише для показу: заняття цього дня скасоване (у файлі не зберігається) */
  cancelled?: boolean;
}

export interface Meta {
  owner: string;
  school: string;
  year: string;
}

export type DayCells = Partial<Record<string, Cell>>;

export interface Schedule {
  version: number;
  meta: Meta;
  slots: Slot[];
  cells: Record<DayKey, DayCells>;
  /** Скасовані заняття на конкретні дати: "2026-11-10:a5" */
  cancelled?: string[];
  updatedAt?: string;
}

/** Кілька однакових слотів підряд, зібраних в один блок */
export interface Block {
  cell: Cell;
  start: string;
  end: string;
  slotIds: string[];
}
