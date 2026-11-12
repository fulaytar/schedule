import { useCallback, useEffect, useState } from 'react';
import { LayoutGrid, List } from 'lucide-react';
import type { Cell } from './types';
import { useSchedule } from './hooks/useSchedule';
import { useEditor } from './hooks/useEditor';
import { useNow } from './hooks/useNow';
import { useTheme } from './hooks/useTheme';
import { useMediaQuery } from './hooks/useMediaQuery';
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
import s from './App.module.css';

type View = 'week' | 'day';

export default function App() {
  const { schedule, setSchedule, error } = useSchedule();
  const editor = useEditor(schedule, setSchedule);
  const now = useNow();
  const { theme, toggle } = useTheme();
  const wide = useMediaQuery('(min-width: 1024px)');

  const [view, setView] = useState<View>(wide ? 'week' : 'day');
  const [userPicked, setUserPicked] = useState(false);
  useEffect(() => {
    if (!userPicked) setView(wide ? 'week' : 'day');
  }, [wide, userPicked]);

  const [unlockOpen, setUnlockOpen] = useState(false);
  const [target, setTarget] = useState<EditTarget | null>(null);
  const [toast, setToast] = useState<ToastMsg | null>(null);
  const notify = (kind: ToastMsg['kind'], text: string) => setToast({ id: Date.now(), kind, text });
  const closeToast = useCallback(() => setToast(null), []);

  const data = editor.view;

  if (error) return <div className={s.state}>{error}</div>;
  if (!data) return <div className={s.state}>Завантажую розклад…</div>;

  const today = dayKeyOf(now);
  const m = nowMin(now);

  const onLockClick = () => {
    if (!editor.editing) return setUnlockOpen(true);
    if (editor.changes > 0) return notify('err', 'Є незбережені зміни: збережи або скасуй їх, а тоді виходь.');
    editor.lock();
  };

  const onSave = async () => {
    const res = await editor.save();
    if (res.ok) notify('ok', 'Збережено. На інших пристроях з’явиться за 1–2 хвилини.');
    else notify('err', res.message);
  };

  const onApply = (cell: Cell | null) => {
    if (target) editor.setCell(target.day, target.slotId, cell);
    setTarget(null);
  };

  return (
    <div className={`${s.page} ${editor.editing ? s.withBar : ''}`}>
      <Header meta={data.meta} theme={theme} onToggleTheme={toggle} editing={editor.editing} onLockClick={onLockClick} />

      <NowCard schedule={data} now={now} />

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
          {editor.editing && <span className={s.hint}>Натисни на клітинку, щоб змінити її</span>}
        </div>
        {view === 'week' ? (
          <WeekGrid schedule={data} today={today} nowMin={m} editing={editor.editing} onEdit={(day, slotId) => setTarget({ day, slotId })} />
        ) : (
          <DayView schedule={data} today={today} nowMin={m} editing={editor.editing} onEdit={(day, slotId) => setTarget({ day, slotId })} />
        )}
        <Legend />
      </section>

      <MonthStats schedule={data} now={now} />
      <Footer updatedAt={data.updatedAt} />

      <UnlockDialog
        open={unlockOpen}
        onClose={() => setUnlockOpen(false)}
        onUnlock={async (pw) => {
          const res = await editor.unlock(pw);
          if (res.ok) notify('ok', 'Режим редагування увімкнено.');
          return res;
        }}
      />
      <CellEditor target={target} schedule={data} onApply={onApply} onClose={() => setTarget(null)} />
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
