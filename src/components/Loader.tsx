import s from './Loader.module.css';

// Кольори «тижня, що заповнюється»: 7 днів × 3 ряди
const PATTERN = [
  ['geo', 'gym', 'gym', 'math', 'it', 'ind', 'gym'],
  ['math', 'math', 'it', 'free', 'it', 'gym', 'free'],
  ['it', 'it', 'it', 'it', 'it', 'ind', 'free'],
];

/** Анімований лоадер: міні-розклад, який заповнюється хвилею */
export function Loader({ text = 'Завантажую розклад…' }: { text?: string }) {
  return (
    <div className={s.wrap} role="status" aria-live="polite">
      <div className={s.grid} aria-hidden="true">
        {PATTERN.flatMap((row, r) =>
          row.map((cat, c) => (
            <span
              key={`${r}-${c}`}
              className={`${s.tile} cat-${cat}`}
              style={{ animationDelay: `${(c + r) * 0.09}s` }}
            />
          )),
        )}
      </div>
      <p className={s.text}>{text}</p>
    </div>
  );
}
