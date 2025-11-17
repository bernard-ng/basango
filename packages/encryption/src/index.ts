import crypto from "node:crypto";

import {
  DEFAULT_AUTH_TAG_LENGTH,
  DEFAULT_BCRYPT_SALT_ROUNDS,
  DEFAULT_ENCRYPTION_ALGORITHM,
  DEFAULT_IV_LENGTH,
} from "@basango/domain/constants";
import { createEnvAccessor } from "@devscast/config";
import * as bcrypt from "bcrypt";

export const env = createEnvAccessor(["BASANGO_ENCRYPTION_KEY"] as const);

function getKey(): Buffer {
  const key = env("BASANGO_ENCRYPTION_KEY");

  if (Buffer.from(key, "hex").length !== 32) {
    throw new Error("BASANGO_ENCRYPTION_KEY must be a 64-character hex string (32 bytes).");
  }
  return Buffer.from(key, "hex");
}

/**
 * Encrypts a plaintext string using AES-256-GCM.
 * @param text The plaintext string to encrypt.
 * @returns A string containing the IV, auth tag, and encrypted text, concatenated and base64 encoded.
 */
export function encrypt(text: string): string {
  const key = getKey();
  const iv = crypto.randomBytes(DEFAULT_IV_LENGTH);
  const cipher = crypto.createCipheriv(DEFAULT_ENCRYPTION_ALGORITHM, key, iv);

  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");

  const authTag = cipher.getAuthTag();

  // Concatenate IV, auth tag, and encrypted data
  const encryptedPayload = Buffer.concat([iv, authTag, Buffer.from(encrypted, "hex")]).toString(
    "base64",
  );

  return encryptedPayload;
}

/**
 * Decrypts an AES-256-GCM encrypted string.
 * @param encryptedPayload The base64 encoded string containing the IV, auth tag, and encrypted text.
 * @returns The original plaintext string.
 */
export function decrypt(encryptedPayload: string): string {
  const key = getKey();
  const dataBuffer = Buffer.from(encryptedPayload, "base64");

  // Extract IV, auth tag, and encrypted data
  const iv = dataBuffer.subarray(0, DEFAULT_IV_LENGTH);
  const authTag = dataBuffer.subarray(
    DEFAULT_IV_LENGTH,
    DEFAULT_IV_LENGTH + DEFAULT_AUTH_TAG_LENGTH,
  );
  const encryptedText = dataBuffer.subarray(DEFAULT_IV_LENGTH + DEFAULT_AUTH_TAG_LENGTH);

  const decipher = crypto.createDecipheriv(DEFAULT_ENCRYPTION_ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(encryptedText.toString("hex"), "hex", "utf8");
  decrypted += decipher.final("utf8");

  return decrypted;
}

export function hash(str: string): string {
  return crypto.createHash("sha256").update(str).digest("hex");
}

export function md5(str: string): string {
  return crypto.createHash("md5").update(str).digest("hex");
}

export function generateRandomBytes(size: number): string {
  return crypto.randomBytes(size).toString("hex");
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, DEFAULT_BCRYPT_SALT_ROUNDS);
}

export async function verifyPassword(password: string, hashed: string): Promise<boolean> {
  return bcrypt.compare(password, hashed);
}
