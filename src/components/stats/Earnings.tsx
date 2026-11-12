import { useEffect, useState, type FormEvent } from 'react';
import { LoaderCircle, Lock } from 'lucide-react';
import type { UnlockResult } from '../../hooks/useEditor';
import s from './stats.module.css';

const uah = (n: number) => `${n.toLocaleString('uk-UA')} грн`;

function lessonsWord(n: number): string {
  const last = n % 10;
  const teen = n % 100 >= 11 && n % 100 <= 14;
  return !teen && last === 1 ? 'заняття' : !teen && last >= 2 && last <= 4 ? 'заняття' : 'занять';
}

interface Props {
  periodLabel: string;
  /** Скільки занять за весь вибраний період */
  sessions: number;
  /** Скільки з них уже минуло (до сьогодні включно); null — період повністю в минулому чи майбутньому */
  done: number | null;
  byTitle: Record<string, number>;
  price: number;
  onSavePrice: (price: number) => Promise<UnlockResult>;
}

/** Дохід від індивідуальних занять — показується лише в режимі змін */
export function Earnings({ periodLabel, sessions, done, byTitle, price, onSavePrice }: Props) {
  const [input, setInput] = useState(String(price));
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  useEffect(() => setInput(String(price)), [price]);

  const next = Number(input);
  const valid = input.trim() !== '' && Number.isFinite(next) && next >= 0;

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!valid || next === price) return;
    setBusy(true);
    const res = await onSavePrice(Math.round(next));
    setBusy(false);
    setMsg(res.ok ? { ok: true, text: 'Ціну збережено.' } : { ok: false, text: res.message });
  };

  const rows = Object.entries(byTitle).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], 'uk'));

  return (
    <div className={s.money}>
      <div className={s.moneyHead}>
        <h3 className={s.chartTitle}>Дохід від індивідуальних занять</h3>
        <span className={s.private}>
          <Lock size={12} /> видно лише в режимі змін
        </span>
      </div>

      <div className={s.moneyMain}>
        <div>
          <div className={s.moneyTotal}>{uah(sessions * price)}</div>
          <div className={s.moneySub}>
            {periodLabel}: {sessions} {lessonsWord(sessions)} × {uah(price)}
          </div>
          {done !== null && (
            <div className={s.moneyDone}>
              По сьогодні включно: {done} {lessonsWord(done)} · {uah(done * price)}
            </div>
          )}
        </div>
        <form className={s.priceForm} onSubmit={submit}>
          <label htmlFor="lesson-price">Ціна заняття, грн</label>
          <div className={s.priceRow}>
            <input
              id="lesson-price"
              type="number"
              min={0}
              step={10}
              inputMode="numeric"
              value={input}
              onChange={(e) => {
                setInput(e.target.value);
                setMsg(null);
              }}
            />
            <button className="btn btn-primary" type="submit" disabled={!valid || next === price || busy}>
              {busy ? <LoaderCircle size={16} className="spin" /> : null}
              Зберегти
            </button>
          </div>
          {msg && <span className={msg.ok ? s.okMsg : s.errMsg}>{msg.text}</span>}
        </form>
      </div>

      {rows.length > 0 && (
        <ul className={s.people}>
          {rows.map(([name, n]) => (
            <li key={name} className="cat-ind">
              <span className={s.person}>{name}</span>
              <span className={s.personCount}>
                {n} {lessonsWord(n)}
              </span>
              <span className={s.personSum}>{uah(n * price)}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
