import { useEffect, useState } from 'react';
import type { Schedule } from '../types';

/** Завантажує розклад, опублікований разом із сайтом */
export function useSchedule() {
  const [schedule, setSchedule] = useState<Schedule | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    fetch(`./data/schedule.json?t=${Date.now()}`, { cache: 'no-store' })
      .then((r) => {
        if (!r.ok) throw new Error(String(r.status));
        return r.json() as Promise<Schedule>;
      })
      .then((data) => alive && setSchedule(data))
      .catch(() => alive && setError('Не вдалося завантажити розклад. Перевір інтернет і онови сторінку.'));
    return () => {
      alive = false;
    };
  }, []);

  return { schedule, setSchedule, error };
}
