import { b64ToBytes, bytesToB64 } from './base64';

/** Формат файла public/data/secret.json (створює scripts/make-secret.mjs) */
export interface SecretBlob {
  v: 1;
  iter: number;
  salt: string;
  iv: string;
  data: string;
}

/** Що лежить усередині після розшифрування */
export interface RepoAccess {
  token: string;
  owner: string;
  repo: string;
  branch: string;
  path: string;
}

/** Зашифровані дані, які бачить лише власник пароля (напр. ціна заняття) */
export interface SealedBlob {
  v: 1;
  iv: string;
  data: string;
}

export interface Unlocked {
  access: RepoAccess;
  /** Ключ із пароля — живе тільки в пам'яті вкладки */
  key: CryptoKey;
}

async function deriveKey(password: string, salt: Uint8Array, iter: number): Promise<CryptoKey> {
  const base = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, [
    'deriveKey',
  ]);
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', hash: 'SHA-256', salt, iterations: iter },
    base,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt'],
  );
}

/** Кидає помилку, якщо пароль невірний (AES-GCM не пройде перевірку цілісності) */
export async function unlockSecret(blob: SecretBlob, password: string): Promise<Unlocked> {
  const key = await deriveKey(password, b64ToBytes(blob.salt), blob.iter);
  const plain = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: b64ToBytes(blob.iv) }, key, b64ToBytes(blob.data));
  return { access: JSON.parse(new TextDecoder().decode(plain)) as RepoAccess, key };
}

export async function seal(key: CryptoKey, value: unknown): Promise<SealedBlob> {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const data = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    new TextEncoder().encode(JSON.stringify(value)),
  );
  return { v: 1, iv: bytesToB64(iv), data: bytesToB64(new Uint8Array(data)) };
}

export async function unseal<T>(key: CryptoKey, blob: SealedBlob): Promise<T> {
  const plain = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: b64ToBytes(blob.iv) }, key, b64ToBytes(blob.data));
  return JSON.parse(new TextDecoder().decode(plain)) as T;
}

/** null — файла немає (редагування не налаштоване). Без інтернету кидає помилку. */
export async function loadSecret(): Promise<SecretBlob | null> {
  const res = await fetch(`./data/secret.json?t=${Date.now()}`, { cache: 'no-store' });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(String(res.status));
  try {
    return (await res.json()) as SecretBlob;
  } catch {
    return null; // замість файла прийшло щось інше
  }
}
