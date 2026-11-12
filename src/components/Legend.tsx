import { CAT_ORDER, CATS } from '../lib/constants';
import { CatIcon } from './CatIcon';
import s from './Legend.module.css';

export function Legend() {
  return (
    <ul className={s.legend} aria-label="Умовні позначення">
      {CAT_ORDER.map((c) => (
        <li key={c} className={`${s.item} cat-${c}`}>
          <CatIcon cat={c} size={14} />
          {CATS[c].label}
        </li>
      ))}
    </ul>
  );
}
