import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;
const ENCODING: BufferEncoding = 'base64';

function getEncryptionKey(): Buffer {
  const keyHex = process.env.FIELD_ENCRYPTION_KEY;
  if (!keyHex) {
    throw new Error('FIELD_ENCRYPTION_KEY environment variable is not set. Cannot encrypt/decrypt sensitive data.');
  }
  const keyBuffer = Buffer.from(keyHex, 'hex');
  if (keyBuffer.length !== 32) {
    throw new Error('FIELD_ENCRYPTION_KEY must be a 64-character hex string (32 bytes for AES-256).');
  }
  return keyBuffer;
}

export function encryptField(plaintext: string): string {
  const key = getEncryptionKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  let encrypted = cipher.update(plaintext, 'utf8');
  encrypted = Buffer.concat([encrypted, cipher.final()]);

  const authTag = cipher.getAuthTag();
  const combined = Buffer.concat([iv, authTag, encrypted]);
  return `enc:${combined.toString(ENCODING)}`;
}

export function decryptField(ciphertext: string): string {
  if (!ciphertext.startsWith('enc:')) {
    return ciphertext;
  }

  const key = getEncryptionKey();
  const combined = Buffer.from(ciphertext.slice(4), ENCODING);

  const iv = combined.subarray(0, IV_LENGTH);
  const authTag = combined.subarray(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH);
  const encrypted = combined.subarray(IV_LENGTH + AUTH_TAG_LENGTH);

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(encrypted);
  decrypted = Buffer.concat([decrypted, decipher.final()]);
  return decrypted.toString('utf8');
}

export function isEncrypted(value: string): boolean {
  return typeof value === 'string' && value.startsWith('enc:');
}

export function encryptSensitiveFields<T extends Record<string, any>>(
  data: T,
  fields: (keyof T)[]
): T {
  if (!process.env.FIELD_ENCRYPTION_KEY) {
    console.warn('[Encryption] FIELD_ENCRYPTION_KEY not set — storing data unencrypted.');
    return data;
  }

  const result = { ...data };
  for (const field of fields) {
    const value = result[field];
    if (typeof value === 'string' && value.length > 0 && !isEncrypted(value)) {
      (result as any)[field] = encryptField(value);
    }
  }
  return result;
}

export function decryptSensitiveFields<T extends Record<string, any>>(
  data: T,
  fields: (keyof T)[]
): T {
  if (!process.env.FIELD_ENCRYPTION_KEY) {
    return data;
  }

  const result = { ...data };
  for (const field of fields) {
    const value = result[field];
    if (typeof value === 'string' && isEncrypted(value)) {
      try {
        (result as any)[field] = decryptField(value);
      } catch (err) {
        console.error(`[Encryption] Failed to decrypt field "${String(field)}":`, err);
      }
    }
  }
  return result;
}

export function encryptJsonField(data: Record<string, any>): string {
  if (!process.env.FIELD_ENCRYPTION_KEY) {
    console.warn('[Encryption] FIELD_ENCRYPTION_KEY not set — storing JSON data unencrypted.');
    return JSON.stringify(data);
  }
  return encryptField(JSON.stringify(data));
}

export function decryptJsonField(value: string): Record<string, any> {
  if (!process.env.FIELD_ENCRYPTION_KEY || !isEncrypted(value)) {
    return typeof value === 'string' ? JSON.parse(value) : value;
  }
  return JSON.parse(decryptField(value));
}
