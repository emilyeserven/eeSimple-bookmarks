import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from "node:crypto";

const SALT = "eesimple-bookmarks-v1";
const ENC_PREFIX = "enc:";

export function encryptionEnabled(): boolean {
  return Boolean(process.env.APP_SECRET);
}

function getKey(): Buffer {
  const secret = process.env.APP_SECRET;
  if (!secret) throw new Error("APP_SECRET not set");
  return scryptSync(secret, SALT, 32) as Buffer;
}

/**
 * Encrypt `text` with AES-256-GCM when APP_SECRET is configured; otherwise return plaintext.
 * The result is prefixed with "enc:" so `maybeDecrypt` can detect encrypted values.
 */
export function maybeEncrypt(text: string): string {
  if (!text || !encryptionEnabled()) return text;
  const iv = randomBytes(12);
  const key = getKey();
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const encrypted = Buffer.concat([cipher.update(text, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return `${ENC_PREFIX}${iv.toString("hex")}:${authTag.toString("hex")}:${encrypted.toString("hex")}`;
}

/**
 * Decrypt an AES-256-GCM value produced by `maybeEncrypt`. If the value is not prefixed with
 * "enc:", it's treated as plaintext and returned as-is (handles pre-encryption stored values).
 * Returns empty string on decryption failure.
 */
export function maybeDecrypt(data: string): string {
  if (!data || !data.startsWith(ENC_PREFIX)) return data;
  if (!encryptionEnabled()) return "";
  const rest = data.slice(ENC_PREFIX.length);
  const parts = rest.split(":");
  if (parts.length !== 3) return "";
  const [ivHex, authTagHex, encryptedHex] = parts;
  try {
    const key = getKey();
    const iv = Buffer.from(ivHex, "hex");
    const authTag = Buffer.from(authTagHex, "hex");
    const encrypted = Buffer.from(encryptedHex, "hex");
    const decipher = createDecipheriv("aes-256-gcm", key, iv);
    decipher.setAuthTag(authTag);
    return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString("utf8");
  }
  catch {
    return "";
  }
}
