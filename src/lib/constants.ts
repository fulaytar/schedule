import type { CatKey, DayKey } from '../types';

export const DAYS: { key: DayKey; short: string; full: string }[] = [
  { key: 'mon', short: 'Пн', full: 'Понеділок' },
  { key: 'tue', short: 'Вт', full: 'Вівторок' },
  { key: 'wed', short: 'Ср', full: 'Середа' },
  { key: 'thu', short: 'Чт', full: 'Четвер' },
  { key: 'fri', short: 'Пт', full: "П'ятниця" },
  { key: 'sat', short: 'Сб', full: 'Субота' },
  { key: 'sun', short: 'Нд', full: 'Неділя' },
];

export interface CatInfo {
  key: CatKey;
  label: string;
  /** Чи рахується як робочий час у статистиці */
  work: boolean;
  defaultTitle: string;
}

export const CATS: Record<CatKey, CatInfo> = {
  math: { key: 'math', label: 'Математика', work: true, defaultTitle: '' },
  geo: { key: 'geo', label: 'Географія', work: true, defaultTitle: '' },
  it: { key: 'it', label: 'IT — робота', work: true, defaultTitle: 'IT' },
  ind: { key: 'ind', label: 'Індивідуальні заняття', work: true, defaultTitle: '' },
  gym: { key: 'gym', label: 'Зал', work: false, defaultTitle: 'Зал' },
  free: { key: 'free', label: 'Вікно', work: false, defaultTitle: 'Вікно' },
};

export const CAT_ORDER: CatKey[] = ['math', 'geo', 'it', 'ind', 'gym', 'free'];

/** JS getDay(): 0 = неділя */
export function dayKeyOf(date: Date): DayKey {
  return (['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'] as DayKey[])[date.getDay()];
}
