/**
 * Блок на добу після двох неправильних паролів поспіль.
 * Зберігається в localStorage цього браузера (інший браузер чи очищення даних його знімає —
 * справжній захист дає пароль і шифрування, це лише відлякувач).
 */
const FAILS = 'rozklad.wrongPasswords';
const UNTIL = 'rozklad.bannedUntil';
export const MAX_WRONG = 2;
export const BAN_MS = 24 * 60 * 60 * 1000;

const read = (k: string) => {
  try {
    return window.localStorage.getItem(k);
  } catch {
    return null;
  }
};
const write = (k: string, v: string | null) => {
  try {
    if (v === null) window.localStorage.removeItem(k);
    else window.localStorage.setItem(k, v);
  } catch {
    /* сховище недоступне — нічого не робимо */
  }
};

/** Час (мс), до якого діє блок, або null */
export function bannedUntil(): number | null {
  const v = Number(read(UNTIL));
  if (!v) return null;
  if (v <= Date.now()) {
    write(UNTIL, null);
    return null;
  }
  return v;
}

/** Записати неправильний пароль. Повертає час кінця блоку, якщо він щойно почався. */
export function recordWrong(): number | null {
  const n = (Number(read(FAILS)) || 0) + 1;
  if (n >= MAX_WRONG) {
    const until = Date.now() + BAN_MS;
    write(UNTIL, String(until));
    write(FAILS, null);
    return until;
  }
  write(FAILS, String(n));
  return null;
}

export const resetWrong = () => write(FAILS, null);
