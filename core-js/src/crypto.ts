import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from 'crypto';

export interface ScryptParams {
  N: number;
  r: number;
  p: number;
  keyLen?: number;
}

export async function deriveKey(password: Buffer | string, salt: Buffer, params: ScryptParams): Promise<Buffer> {
  const keyLen = params.keyLen ?? 32;
  const passBuf = typeof password === 'string' ? Buffer.from(password, 'utf8') : password;
  const key = scryptSync(passBuf, salt, keyLen, { N: params.N, r: params.r, p: params.p });
  return Promise.resolve(key);
}

export function encrypt(aad: Buffer, key: Buffer, plaintext: Buffer): { iv: Buffer; tag: Buffer; ciphertext: Buffer } {
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', key, iv);
  if (aad && aad.length) cipher.setAAD(aad);
  const ciphertext = Buffer.concat([cipher.update(plaintext), cipher.final()]);
  const tag = cipher.getAuthTag();
  return { iv, tag, ciphertext };
}

export function decrypt(aad: Buffer, key: Buffer, iv: Buffer, tag: Buffer, ciphertext: Buffer): Buffer {
  const decipher = createDecipheriv('aes-256-gcm', key, iv);
  if (aad && aad.length) decipher.setAAD(aad);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(ciphertext), decipher.final()]);
}
