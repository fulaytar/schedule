import { useEffect, useMemo, useState } from 'react';
import s from './BanScreen.module.css';

const LINES = [
  'Два рази мимо. Пароль — це не лотерея.',
  'Хтось дуже хотів поміняти чужий розклад. Не вийшло.',
  'Підбирати пароль — погана ідея. Розклад тобі не належить.',
  'Двічі не вгадав. Отже, й не знаєш.',
];

function left(ms: number) {
  const m = Math.max(0, Math.ceil(ms / 60000));
  const h = Math.floor(m / 60);
  return h > 0 ? `${h} год ${m % 60} хв` : `${m} хв`;
}

interface Props {
  until: number;
  /** Час вийшов — показати сайт знову */
  onExpire: () => void;
}

/** Повноекранне попередження: редагування з цього браузера закрите на добу */
export function BanScreen({ until, onExpire }: Props) {
  const line = useMemo(() => LINES[Math.floor(Math.random() * LINES.length)], []);
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const t = window.setInterval(() => setNow(Date.now()), 30000);
    return () => window.clearInterval(t);
  }, []);
  useEffect(() => {
    if (now >= until) onExpire();
  }, [now, until, onExpire]);

  return (
    <div className={s.overlay} role="alertdialog" aria-modal="true" aria-labelledby="ban-title">
      <div className={s.card}>
        <AngryLock />
        <h2 id="ban-title" className={s.title}>
          Доступ закрито на добу
        </h2>
        <p className={s.line}>{line}</p>
        <p className={s.sub}>
          Двічі введено неправильний пароль. Сайт із цього браузера знову відкриється через{' '}
          <b>{left(until - now)}</b>.
        </p>
      </div>
    </div>
  );
}

/** Сердитий замок — власна картинка, без зовнішніх файлів */
function AngryLock() {
  return (
    <svg className={s.pic} viewBox="0 0 200 200" aria-hidden="true">
      <circle cx="100" cy="108" r="86" fill="var(--danger-soft)" />
      {/* дужка */}
      <path d="M62 92 V68 a38 38 0 0 1 76 0 V92" fill="none" stroke="#6b7280" strokeWidth="14" strokeLinecap="round" />
      {/* корпус */}
      <rect x="40" y="86" width="120" height="92" rx="20" fill="#e2493b" />
      <rect x="40" y="86" width="120" height="22" rx="11" fill="#f0675a" opacity="0.6" />
      {/* брови */}
      <path d="M66 112 L92 122" stroke="#3b0d09" strokeWidth="7" strokeLinecap="round" />
      <path d="M134 112 L108 122" stroke="#3b0d09" strokeWidth="7" strokeLinecap="round" />
      {/* очі */}
      <circle cx="80" cy="132" r="8" fill="#fff" />
      <circle cx="120" cy="132" r="8" fill="#fff" />
      <circle cx="82" cy="134" r="4" fill="#3b0d09" />
      <circle cx="118" cy="134" r="4" fill="#3b0d09" />
      {/* рот */}
      <path d="M78 162 Q100 148 122 162" fill="none" stroke="#3b0d09" strokeWidth="6" strokeLinecap="round" />
      {/* пара з голови */}
      <path d="M30 70 q-8 -10 0 -20 q8 -10 0 -20" fill="none" stroke="#e2493b" strokeWidth="5" strokeLinecap="round" opacity="0.7" />
      <path d="M170 70 q8 -10 0 -20 q-8 -10 0 -20" fill="none" stroke="#e2493b" strokeWidth="5" strokeLinecap="round" opacity="0.7" />
      {/* «×2» */}
      <g transform="translate(150 30) rotate(12)">
        <rect x="-22" y="-16" width="44" height="32" rx="8" fill="#3b0d09" />
        <text x="0" y="7" textAnchor="middle" fontSize="20" fontWeight="800" fill="#fff" fontFamily="inherit">
          ×2
        </text>
      </g>
    </svg>
  );
}
