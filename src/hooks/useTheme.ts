import { useCallback, useEffect, useState } from 'react';
import { useMediaQuery } from './useMediaQuery';

type Choice = 'light' | 'dark' | null;

function read(): Choice {
  try {
    const v = localStorage.getItem('theme');
    return v === 'light' || v === 'dark' ? v : null;
  } catch {
    return null;
  }
}

/** Тема: системна за замовчуванням, перемикач запам'ятовується на пристрої */
export function useTheme() {
  const [choice, setChoice] = useState<Choice>(read);
  const systemDark = useMediaQuery('(prefers-color-scheme: dark)');
  const resolved: 'light' | 'dark' = choice ?? (systemDark ? 'dark' : 'light');

  useEffect(() => {
    const root = document.documentElement;
    if (choice) root.setAttribute('data-theme', choice);
    else root.removeAttribute('data-theme');
    try {
      if (choice) localStorage.setItem('theme', choice);
      else localStorage.removeItem('theme');
    } catch {
      /* приватний режим — просто не запам'ятовуємо */
    }
  }, [choice]);

  const toggle = useCallback(() => setChoice(resolved === 'dark' ? 'light' : 'dark'), [resolved]);
  return { theme: resolved, toggle };
}
