export function toMin(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
}

export function fromMin(total: number): string {
  const h = Math.floor(total / 60);
  const m = total % 60;
  return `${h}:${String(m).padStart(2, '0')}`;
}

/** "08:10" → "8:10" */
export function pretty(hhmm: string): string {
  return fromMin(toMin(hhmm));
}

export function nowMin(date: Date): number {
  return date.getHours() * 60 + date.getMinutes();
}

export function hoursLabel(minutes: number): string {
  const h = minutes / 60;
  const rounded = Math.round(h * 10) / 10;
  return `${String(rounded).replace('.', ',')} год`;
}

export const MONTHS = [
  'Січень', 'Лютий', 'Березень', 'Квітень', 'Травень', 'Червень',
  'Липень', 'Серпень', 'Вересень', 'Жовтень', 'Листопад', 'Грудень',
];
