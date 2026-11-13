/**
 * Звідки брати дані (розклад, календар, зашифрований токен).
 * На сайті — поруч зі сторінкою ("./"). У застосунку для телефона дані беруться
 * з опублікованого сайту, щоб апка завжди показувала свіжий розклад
 * (задається змінною VITE_DATA_BASE під час збирання, див. .github/workflows/mobile.yml).
 */
const BASE: string = import.meta.env.VITE_DATA_BASE || './';

export const dataUrl = (file: string) => `${BASE.replace(/\/?$/, '/')}data/${file}?t=${Date.now()}`;

/** Чи це застосунок для телефона (а не сайт у браузері) */
export const isApp = BASE !== './';
