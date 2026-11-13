import { useCallback, useEffect, useState } from 'react';
import type { Schedule } from '../types';
import { withSlotsToMidnight } from '../lib/slots';
import { dataUrl } from '../lib/dataUrl';

const CACHE = 'rozklad.lastSchedule';

const readCache = (): Schedule | null => {
  try {
    const raw = window.localStorage.getItem(CACHE);
    return raw ? (JSON.parse(raw) as Schedule) : null;
  } catch {
    return null;
  }
};
const writeCache = (s: Schedule) => {
  try {
    window.localStorage.setItem(CACHE, JSON.stringify(s));
  } catch {
    /* сховище недоступне */
  }
};

/**
 * Завантажує розклад. Останній завантажений зберігається на пристрої:
 * без інтернету показуємо його (зверху буде смужка «Немає інтернету»).
 * Повторює спробу, коли з'являється інтернет.
 */
export function useSchedule() {
  const [schedule, setSchedule] = useState<Schedule | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let alive = true;
    setError(null);
    fetch(dataUrl('schedule.json'), { cache: 'no-store' })
      .then((r) => {
        if (!r.ok) throw new Error(String(r.status));
        return r.json() as Promise<Schedule>;
      })
      .then((data) => {
        if (!alive) return;
        writeCache(data);
        setSchedule(withSlotsToMidnight(data));
      })
      .catch(() => {
        if (!alive) return;
        const cached = readCache();
        if (cached) setSchedule((cur) => cur ?? withSlotsToMidnight(cached));
        setError('Не вдалося завантажити розклад. Перевір інтернет і онови сторінку.');
      });
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
