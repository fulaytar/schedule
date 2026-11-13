import { withSlotsToMidnight } from './slots';
import type { Schedule } from '../types';
import type { RepoAccess } from './crypto';
import { b64ToUtf8, utf8ToB64 } from './base64';

const API = 'https://api.github.com';

function headers(token: string): HeadersInit {
  return {
    Authorization: `Bearer ${token}`,
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
  };
}

const fileUrl = (a: RepoAccess, path: string) => `${API}/repos/${a.owner}/${a.repo}/contents/${path}`;

function explain(status: number): string {
  if (status === 401) return 'GitHub не прийняв токен: він недійсний або строк дії минув.';
  if (status === 403) return 'Токен не має права змінювати файли в цьому репозиторії.';
  if (status === 404) return 'Репозиторій або файл не знайдено. Перевір назву репозиторію в секреті.';
  if (status === 409) return 'Файл щойно змінився в іншому місці. Онови сторінку й повтори.';
  if (status === 422) return 'GitHub відхилив зміни. Онови сторінку й спробуй ще раз.';
  return `GitHub повернув помилку ${status}.`;
}

export class GitHubError extends Error {}

/** Файл із репозиторію; null, якщо його ще немає */
export async function getFile(a: RepoAccess, path: string): Promise<{ text: string; sha: string } | null> {
  const res = await fetch(`${fileUrl(a, path)}?ref=${encodeURIComponent(a.branch)}`, {
    headers: headers(a.token),
    cache: 'no-store',
  });
  if (res.status === 404) return null;
  if (!res.ok) throw new GitHubError(explain(res.status));
  const body = (await res.json()) as { sha: string; content: string };
  return { text: b64ToUtf8(body.content), sha: body.sha };
}

/** Створює або оновлює файл; повертає новий sha */
export async function putFile(
  a: RepoAccess,
  path: string,
  text: string,
  sha: string | null,
  message: string,
): Promise<string> {
  const res = await fetch(fileUrl(a, path), {
    method: 'PUT',
    headers: { ...headers(a.token), 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, content: utf8ToB64(text), branch: a.branch, ...(sha ? { sha } : {}) }),
  });
  if (!res.ok) throw new GitHubError(explain(res.status));
  const body = (await res.json()) as { content: { sha: string } };
  return body.content.sha;
}

/** Найсвіжіша версія розкладу просто з репозиторію + її sha для наступного збереження */
export async function fetchRemote(a: RepoAccess): Promise<{ schedule: Schedule; sha: string }> {
  const file = await getFile(a, a.path);
  if (!file) throw new GitHubError(explain(404));
  return { schedule: withSlotsToMidnight(JSON.parse(file.text) as Schedule), sha: file.sha };
}

export function saveRemote(a: RepoAccess, schedule: Schedule, sha: string): Promise<string> {
  return putFile(
    a,
    a.path,
    JSON.stringify(schedule, null, 2) + '\n',
    sha,
    `Розклад оновлено ${new Date().toLocaleString('uk-UA')}`,
  );
}
