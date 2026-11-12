import { useEffect, useState } from 'react';
import type { SchoolCalendar } from '../lib/calendar';

/**
 * Календар навчального року. Якщо файла немає — усі дні вважаються навчальними.
 * `ready` — розклад уже завантажився: якщо календар не прийшов (не було інтернету), пробуємо ще раз.
 */
export function useCalendar(ready = true): SchoolCalendar | null {
  const [cal, setCal] = useState<SchoolCalendar | null>(null);
  const [done, setDone] = useState(false);
  useEffect(() => {
    if (done || !ready) return;
    let alive = true;
    fetch(`./data/calendar.json?t=${Date.now()}`, { cache: 'no-store' })
      .then((r) => {
        if (alive) setDone(true); // відповідь є (навіть 404) — більше не питаємо
        return r.ok ? (r.json() as Promise<SchoolCalendar>) : null;
      })
      .then((c) => alive && c && setCal(c))
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [ready, done]);
  return cal;
}
