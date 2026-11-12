import { useEffect, useState } from 'react';
import type { SchoolCalendar } from '../lib/calendar';

/** Календар навчального року. Якщо файла немає — усі дні вважаються навчальними. */
export function useCalendar(): SchoolCalendar | null {
  const [cal, setCal] = useState<SchoolCalendar | null>(null);
  useEffect(() => {
    fetch(`./data/calendar.json?t=${Date.now()}`, { cache: 'no-store' })
      .then((r) => (r.ok ? (r.json() as Promise<SchoolCalendar>) : null))
      .then((c) => c && setCal(c))
      .catch(() => {});
  }, []);
  return cal;
}
