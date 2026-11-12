import { WifiOff } from 'lucide-react';
import s from './OfflineBar.module.css';

/** Смужка вгорі, коли зник інтернет, а розклад уже відкритий */
export function OfflineBar() {
  return (
    <div className={s.bar} role="status">
      <WifiOff size={16} />
      <span>
        <b>Немає інтернету.</b> Показано розклад, завантажений раніше.
      </span>
    </div>
  );
}
