#!/usr/bin/env node
/**
 * Створює public/data/secret.json — GitHub-токен, зашифрований твоїм паролем.
 * Запуск:  npm run secret
 *
 * Токен ніде не зберігається у відкритому вигляді: у файлі лише шифр
 * (AES-256-GCM, ключ із пароля через PBKDF2-SHA256, 600 000 ітерацій).
 * Без пароля з файла нічого не витягнути — тож пароль має бути довгим.
 */
import { writeFile, mkdir } from 'node:fs/promises';
import { createInterface } from 'node:readline';
import { stdin, stdout } from 'node:process';

const ITER = 600_000;
const OUT = new URL('../public/data/secret.json', import.meta.url);
const enc = new TextEncoder();
const b64 = (u8) => Buffer.from(u8).toString('base64');

function ask(question, { hidden = false, def = '' } = {}) {
  return new Promise((resolve) => {
    const rl = createInterface({ input: stdin, output: stdout, terminal: true });
    if (hidden) {
      rl._writeToOutput = (s) => {
        if (s.includes(question)) stdout.write(s);
        else stdout.write('*'.repeat(s.length > 1 ? 0 : 1));
      };
    }
    rl.question(question + (def ? ` [${def}]` : '') + ': ', (ans) => {
      rl.close();
      if (hidden) stdout.write('\n');
      resolve(ans.trim() || def);
    });
  });
}

function weak(pw) {
  const problems = [];
  if (pw.length < 14) problems.push('щонайменше 14 символів');
  if (!/[a-zа-яіїєґ]/.test(pw)) problems.push('малі літери');
  if (!/[A-ZА-ЯІЇЄҐ]/.test(pw)) problems.push('великі літери');
  if (!/\d/.test(pw)) problems.push('цифри');
  if (!/[^\p{L}\d]/u.test(pw)) problems.push('символи на кшталт ! ? # _ -');
  return problems;
}

async function check({ token, owner, repo, branch, path }) {
  try {
    const res = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/contents/${path}?ref=${encodeURIComponent(branch)}`,
      { headers: { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github+json' } },
    );
    if (res.ok) return '✓ Токен бачить файл розкладу в репозиторії.';
    if (res.status === 401) return '✗ GitHub не прийняв токен (401). Перевір, що скопіював його повністю.';
    if (res.status === 404) return '✗ Не знайдено репозиторій або файл (404). Перевір логін, назву репо й гілку, і що код уже завантажено.';
    return `✗ GitHub відповів ${res.status}.`;
  } catch {
    return '… Не вдалося перевірити токен (немає інтернету). Секрет усе одно створено.';
  }
}

console.log('\nНалаштування редагування розкладу\n');
const owner = await ask('Твій логін на GitHub');
const repo = await ask('Назва репозиторію', { def: 'schedule' });
const branch = await ask('Гілка', { def: 'main' });
const token = await ask('GitHub-токен (fine-grained, доступ Contents: Read and write)', { hidden: true });
if (!owner || !token) {
  console.error('\nПотрібні логін і токен. Нічого не створено.');
  process.exit(1);
}

let password;
for (;;) {
  password = await ask('Придумай пароль для редагування', { hidden: true });
  if (password.length < 8) {
    console.log('  Пароль має бути хоча б 8 символів.');
    continue;
  }
  const problems = weak(password);
  if (problems.length) {
    console.log(`  Увага: пароль простий. Для надійності можна додати: ${problems.join(', ')}.`);
    const ok = await ask('  Все одно використати його? (так/ні)', { def: 'ні' });
    if (!/^(т|так|y|yes)$/i.test(ok)) continue;
  }
  const again = await ask('Повтори пароль', { hidden: true });
  if (again !== password) {
    console.log('  Паролі не збігаються, ще раз.');
    continue;
  }
  break;
}

const access = { token, owner, repo, branch, path: 'public/data/schedule.json' };
const { subtle, getRandomValues } = globalThis.crypto;
const salt = getRandomValues.call(globalThis.crypto, new Uint8Array(16));
const iv = getRandomValues.call(globalThis.crypto, new Uint8Array(12));
const base = await subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveKey']);
const key = await subtle.deriveKey(
  { name: 'PBKDF2', hash: 'SHA-256', salt, iterations: ITER },
  base,
  { name: 'AES-GCM', length: 256 },
  false,
  ['encrypt'],
);
const data = new Uint8Array(await subtle.encrypt({ name: 'AES-GCM', iv }, key, enc.encode(JSON.stringify(access))));

await mkdir(new URL('../public/data/', import.meta.url), { recursive: true });
await writeFile(OUT, JSON.stringify({ v: 1, iter: ITER, salt: b64(salt), iv: b64(iv), data: b64(data) }, null, 2) + '\n');

console.log('\n✓ Створено public/data/secret.json');
console.log(await check(access));
console.log('\nДалі: закоміть і запуш secret.json — і на сайті запрацює кнопка «Змінити».');
console.log('Пароль ніде не записано. Якщо забудеш — просто запусти npm run secret ще раз.\n');
