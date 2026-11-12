import s from './Footer.module.css';

export function Footer({ updatedAt }: { updatedAt?: string }) {
  const when = updatedAt
    ? new Date(updatedAt).toLocaleString('uk-UA', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })
    : null;
  return (
    <footer className={s.footer}>
      {when && <span>Оновлено {when}</span>}
      <span>Час уроків — за розкладом дзвінків 5–11 кл.</span>
    </footer>
  );
}
