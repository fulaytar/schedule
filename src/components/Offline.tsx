import { RotateCw } from 'lucide-react';
import s from './Offline.module.css';

interface Props {
  text: string;
  onRetry: () => void;
}

/** Немає інтернету / не вдалося завантажити розклад */
export function Offline({ text, onRetry }: Props) {
  return (
    <div className={s.wrap} role="alert">
      <svg className={s.pic} viewBox="0 0 220 180" aria-hidden="true">
        <ellipse cx="110" cy="166" rx="74" ry="7" fill="var(--ink)" opacity="0.07" />
        {/* аркуш розкладу */}
        <g className={s.sheet}>
          <rect x="34" y="28" width="132" height="122" rx="18" fill="var(--surface)" stroke="var(--border)" strokeWidth="2" />
          <path d="M34 46 a18 18 0 0 1 18 -18 h96 a18 18 0 0 1 18 18 v10 h-132z" fill="var(--accent)" />
          <rect x="62" y="18" width="8" height="22" rx="4" fill="var(--ink-3)" />
          <rect x="130" y="18" width="8" height="22" rx="4" fill="var(--ink-3)" />
          {[0, 1, 2, 3].map((c) =>
            [0, 1, 2].map((r) => (
              <rect
                key={`${c}${r}`}
                x={50 + c * 26}
                y={70 + r * 24}
                width="20"
                height="16"
                rx="5"
                fill="var(--free-bg)"
              />
            )),
          )}
        </g>
        {/* значок «немає мережі» */}
        <g className={s.badge}>
          <circle cx="166" cy="128" r="30" fill="var(--danger)" />
          <g fill="none" stroke="#fff" strokeWidth="5" strokeLinecap="round">
            <path d="M149 123 a24 24 0 0 1 34 0" />
            <path d="M156 131 a14 14 0 0 1 20 0" />
            <path d="M151 112 L181 144" />
          </g>
          <circle cx="166" cy="140" r="3.5" fill="#fff" />
        </g>
        {/* «z z» — розклад спить */}
        <g className={s.zz} fill="var(--ink-3)" fontFamily="inherit" fontWeight="800">
          <text x="20" y="40" fontSize="16">z</text>
          <text x="8" y="22" fontSize="11">z</text>
        </g>
      </svg>
      <h2 className={s.title}>Немає зв’язку</h2>
      <p className={s.text}>{text}</p>
      <button className="btn btn-primary" onClick={onRetry}>
        <RotateCw size={16} /> Спробувати ще раз
      </button>
    </div>
  );
}
