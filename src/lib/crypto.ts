import { b64ToBytes } from './base64';

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

async function deriveKey(password: string, salt: Uint8Array, iter: number): Promise<CryptoKey> {
  const base = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, [
    'deriveKey',
  ]);
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', hash: 'SHA-256', salt, iterations: iter },
    base,
    { name: 'AES-GCM', length: 256 },
    false,
    ['decrypt'],
  );
}

/** Кидає помилку, якщо пароль невірний (AES-GCM не пройде перевірку цілісності) */
export async function unlockSecret(blob: SecretBlob, password: string): Promise<RepoAccess> {
  const key = await deriveKey(password, b64ToBytes(blob.salt), blob.iter);
  const plain = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: b64ToBytes(blob.iv) }, key, b64ToBytes(blob.data));
  return JSON.parse(new TextDecoder().decode(plain)) as RepoAccess;
}

export async function loadSecret(): Promise<SecretBlob | null> {
  try {
    const res = await fetch(`./data/secret.json?t=${Date.now()}`, { cache: 'no-store' });
    if (!res.ok) return null;
    return (await res.json()) as SecretBlob;
  } catch {
    return null;
  }
}
