import crypto from "crypto";
import { getConfig } from "../config/secrets";

/**
 * Utilitas AES-256-GCM menggunakan kunci yang diturunkan dari JWT_SECRET.
 * Digunakan untuk mengenkripsi kredensial sensitif di database.
 */

const getSecret = () => {
  try {
    return getConfig().JWT_SECRET || "fallback-secret-for-development-only";
  } catch {
    return "fallback-secret-for-development-only";
  }
};

export const deriveKey = (secret: string): Buffer => {
  // Gunakan SHA-256 untuk menurunkan kunci 32-byte dari secret
  return crypto.createHash("sha256").update(secret).digest();
};

export function encrypt(plaintext: string): string {
  const secret = getSecret();
  const key = deriveKey(secret);
  const iv = crypto.randomBytes(12); // 96-bit nonce for GCM
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  // Paket: iv(12) + tag(16) + ciphertext
  const payload = Buffer.concat([iv, tag, encrypted]);
  return payload.toString("base64");
}

export function decrypt(dataB64: string): string {
  const secret = getSecret();
  const data = Buffer.from(dataB64, "base64");
  const key = deriveKey(secret);
  const iv = data.slice(0, 12);
  const tag = data.slice(12, 28);
  const ciphertext = data.slice(28);
  const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(tag);
  const decrypted = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
  return decrypted.toString("utf8");
}

export function sha256Hex(input: string): string {
  return crypto.createHash("sha256").update(input).digest("hex");
}
