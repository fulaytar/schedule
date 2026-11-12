export function bytesToB64(bytes: Uint8Array): string {
  let bin = '';
  bytes.forEach((b) => (bin += String.fromCharCode(b)));
  return btoa(bin);
}

export function b64ToBytes(b64: string): Uint8Array {
  const bin = atob(b64.replace(/\s/g, ''));
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

export const utf8ToB64 = (text: string) => bytesToB64(new TextEncoder().encode(text));
export const b64ToUtf8 = (b64: string) => new TextDecoder().decode(b64ToBytes(b64));
