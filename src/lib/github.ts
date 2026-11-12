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

function url(a: RepoAccess): string {
  return `${API}/repos/${a.owner}/${a.repo}/contents/${a.path}`;
}

function explain(status: number): string {
  if (status === 401) return 'GitHub не прийняв токен: він недійсний або строк дії минув.';
  if (status === 403) return 'Токен не має права змінювати файли в цьому репозиторії.';
  if (status === 404) return 'Репозиторій або файл не знайдено. Перевір назву репозиторію в секреті.';
  if (status === 409) return 'Файл щойно змінився в іншому місці. Онови сторінку й повтори.';
  if (status === 422) return 'GitHub відхилив зміни. Онови сторінку й спробуй ще раз.';
  return `GitHub повернув помилку ${status}.`;
}

export class GitHubError extends Error {}

/** Найсвіжіша версія розкладу просто з репозиторію + її sha для наступного збереження */
export async function fetchRemote(a: RepoAccess): Promise<{ schedule: Schedule; sha: string }> {
  const res = await fetch(`${url(a)}?ref=${encodeURIComponent(a.branch)}`, {
    headers: headers(a.token),
    cache: 'no-store',
  });
  if (!res.ok) throw new GitHubError(explain(res.status));
  const body = (await res.json()) as { sha: string; content: string };
  return { schedule: JSON.parse(b64ToUtf8(body.content)) as Schedule, sha: body.sha };
}

export async function saveRemote(a: RepoAccess, schedule: Schedule, sha: string): Promise<string> {
  const res = await fetch(url(a), {
    method: 'PUT',
    headers: { ...headers(a.token), 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message: `Розклад оновлено ${new Date().toLocaleString('uk-UA')}`,
      content: utf8ToB64(JSON.stringify(schedule, null, 2) + '\n'),
      sha,
      branch: a.branch,
    }),
  });
  if (!res.ok) throw new GitHubError(explain(res.status));
  const body = (await res.json()) as { content: { sha: string } };
  return body.content.sha;
}
