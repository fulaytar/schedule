import s from './stats.module.css';

export function StatTile({ label, value, hint, accent }: { label: string; value: string; hint: string; accent?: boolean }) {
  return (
    <div className={`${s.tile} ${accent ? s.tileAccent : ''}`}>
      <span className={s.tileLabel}>{label}</span>
      <span className={s.tileValue}>{value}</span>
      <span className={s.tileHint}>{hint}</span>
    </div>
  );
}
