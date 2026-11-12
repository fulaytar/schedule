import { useCallback, useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, LayoutGrid, List } from 'lucide-react';
import type { Cell } from './types';
import { useSchedule } from './hooks/useSchedule';
import { useEditor } from './hooks/useEditor';
import { useNow } from './hooks/useNow';
import { useTheme } from './hooks/useTheme';
import { useMediaQuery } from './hooks/useMediaQuery';
import { useCalendar } from './hooks/useCalendar';
import { isCancelled, weekDates, weekOffsetBounds } from './lib/calendar';
import { dayKeyOf } from './lib/constants';
import { nowMin } from './lib/time';
import { Header } from './components/Header';
import { NowCard } from './components/NowCard';
import { Segmented } from './components/Segmented';
import { WeekGrid } from './components/WeekGrid';
import { DayView } from './components/DayView';
import { Legend } from './components/Legend';
import { MonthStats } from './components/stats/MonthStats';
import { UnlockDialog } from './components/UnlockDialog';
import { CellEditor, type EditTarget } from './components/CellEditor';
import { SaveBar } from './components/SaveBar';
import { Toast, type ToastMsg } from './components/Toast';
import { Footer } from './components/Footer';
import { BanScreen } from './components/BanScreen';
import { Loader } from './components/Loader';
import { Offline } from './components/Offline';
import { bannedUntil } from './lib/ban';
import s from './App.module.css';

type View = 'week' | 'day';

export default function App() {
  const { schedule, setSchedule, error, retry } = useSchedule();
  const editor = useEditor(schedule, setSchedule);
  const now = useNow();
  const { theme, toggle } = useTheme();
  const cal = useCalendar(schedule !== null);
  const wide = useMediaQuery('(min-width: 1024px)');

  const [view, setView] = useState<View>(wide ? 'week' : 'day');
  const [userPicked, setUserPicked] = useState(false);
  useEffect(() => {
    if (!userPicked) setView(wide ? 'week' : 'day');
  }, [wide, userPicked]);

  const [weekOffset, setWeekOffset] = useState(0);
  const [unlockOpen, setUnlockOpen] = useState(false);
  // блок після двох неправильних паролів: показуємо одразу при вході
  const [ban, setBan] = useState<number | null>(() => bannedUntil());
  const [target, setTarget] = useState<EditTarget | null>(null);
  const [toast, setToast] = useState<ToastMsg | null>(null);
  const notify = (kind: ToastMsg['kind'], text: string) => setToast({ id: Date.now(), kind, text });
  const closeToast = useCallback(() => setToast(null), []);

  const data = editor.view;

  // заблокований браузер бачить лише попередження — без розкладу
  if (ban !== null) return <BanScreen until={ban} onExpire={() => setBan(bannedUntil())} />;
  if (error && !data) return <Offline text={error} onRetry={retry} />;
  if (!data) return <Loader />;

  // тижні — лише в межах навчального року (вересень — кінець ІІ семестру)
  const bounds = weekOffsetBounds(cal, now);
  const offset = Math.min(Math.max(weekOffset, bounds.min), bounds.max);
  const shown = new Date(now.getFullYear(), now.getMonth(), now.getDate() + offset * 7);
  const week = weekDates(shown);
  const today = offset === 0 ? dayKeyOf(now) : null;
  const m = nowMin(now);
  const fmt = (d: Date, month: boolean) =>
    d.toLocaleDateString('uk-UA', month ? { day: 'numeric', month: 'long' } : { day: 'numeric' });
  const weekLabel =
    week.mon.getMonth() === week.sun.getMonth()
      ? `${fmt(week.mon, false)}–${fmt(week.sun, true)}`
      : `${fmt(week.mon, true)} – ${fmt(week.sun, true)}`;
  const edit = (day: EditTarget['day'], slotId: string) => setTarget({ day, slotId, date: week[day] });

  const onLockClick = () => {
    if (!editor.editing) {
      const until = bannedUntil();
      setBan(until);
      if (until) return;
      return setUnlockOpen(true);
    }
    if (editor.changes > 0) return notify('err', 'Є незбережені зміни: збережи або скасуй їх, а тоді виходь.');
    editor.lock();
  };

  const onSave = async () => {
    const res = await editor.save();
    if (res.ok) notify('ok', 'Збережено. На інших пристроях з’явиться за 1–2 хвилини.');
    else notify('err', res.message);
  };

  const onApply = (cell: Cell | null, cancelled: boolean) => {
    if (target) {
      editor.setCell(target.day, target.slotId, cell);
      editor.setCancelled(target.date, target.slotId, cell !== null && cancelled);
    }
    setTarget(null);
  };

  return (
    <div className={`${s.page} ${editor.editing ? s.withBar : ''}`}>
      <Header meta={data.meta} theme={theme} onToggleTheme={toggle} editing={editor.editing} onLockClick={onLockClick} />

      <NowCard schedule={data} cal={cal} now={now} />

      <section className={`${s.board} card`} aria-label="Розклад">
        <div className={s.toolbar}>
          <Segmented<View>
            label="Вигляд"
            value={view}
            onChange={(v) => {
              setUserPicked(true);
              setView(v);
            }}
            options={[
              { value: 'week', label: 'Тиждень', icon: <LayoutGrid size={15} /> },
              { value: 'day', label: 'День', icon: <List size={15} /> },
            ]}
          />
          <div className={s.weekNav} aria-label="Тиждень">
            <button className="btn btn-ghost btn-icon" onClick={() => setWeekOffset(offset - 1)} disabled={offset <= bounds.min} aria-label="Попередній тиждень">
              <ChevronLeft size={18} />
            </button>
            <span className={s.weekLabel}>{weekLabel}</span>
            <button className="btn btn-ghost btn-icon" onClick={() => setWeekOffset(offset + 1)} disabled={offset >= bounds.max} aria-label="Наступний тиждень">
              <ChevronRight size={18} />
            </button>
            {offset !== 0 && (
              <button className="btn btn-ghost" onClick={() => setWeekOffset(0)}>
                Цей тиждень
              </button>
            )}
          </div>
          {editor.editing && (
            <span className={s.hint}>Натисни на клітинку, щоб змінити її або позначити, що заняття не було</span>
          )}
        </div>
        {view === 'week' ? (
          <WeekGrid schedule={data} cal={cal} week={week} today={today} nowMin={m} editing={editor.editing} onEdit={edit} />
        ) : (
          <DayView schedule={data} cal={cal} week={week} today={today} nowMin={m} editing={editor.editing} onEdit={edit} />
        )}
        <Legend />
      </section>

      <MonthStats schedule={data} cal={cal} now={now} money={editor.money} />
      <Footer updatedAt={data.updatedAt} />

      <UnlockDialog
        open={unlockOpen}
        onClose={() => setUnlockOpen(false)}
        onUnlock={async (pw) => {
          const res = await editor.unlock(pw);
          if (res.ok) notify('ok', 'Режим редагування увімкнено.');
          return res;
        }}
        onBanned={(until) => setBan(until)}
      />
      <CellEditor
        target={target}
        schedule={data}
        cancelled={target ? isCancelled(data, target.date, target.slotId) : false}
        onApply={onApply}
        onClose={() => setTarget(null)}
      />
      {editor.editing && (
        <SaveBar
          changes={editor.changes}
          saving={editor.saving}
          onSave={onSave}
          onDiscard={editor.discard}
          onExit={onLockClick}
        />
      )}
      <Toast toast={toast} onDone={closeToast} />
    </div>
  );
}
