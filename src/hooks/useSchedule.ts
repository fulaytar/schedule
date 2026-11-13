import { useCallback, useEffect, useState } from 'react';
import type { Schedule } from '../types';
import { withSlotsToMidnight } from '../lib/slots';

/** Завантажує розклад, опублікований разом із сайтом. Повторює спробу, коли з'являється інтернет. */
export function useSchedule() {
  const [schedule, setSchedule] = useState<Schedule | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let alive = true;
    setError(null);
    fetch(`./data/schedule.json?t=${Date.now()}`, { cache: 'no-store' })
      .then((r) => {
        if (!r.ok) throw new Error(String(r.status));
        return r.json() as Promise<Schedule>;
      })
      .then((data) => alive && setSchedule(withSlotsToMidnight(data)))
      .catch(() => alive && setError('Не вдалося завантажити розклад. Перевір інтернет і онови сторінку.'));
    return () => {
      alive = false;
    };
  }, [attempt]);

  const retry = useCallback(() => setAttempt((n) => n + 1), []);

  // інтернет повернувся — пробуємо самі
  useEffect(() => {
    if (!error) return;
    window.addEventListener('online', retry);
    return () => window.removeEventListener('online', retry);
  }, [error, retry]);

  return { schedule, setSchedule, error, retry };
}
