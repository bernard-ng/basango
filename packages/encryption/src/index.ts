import crypto from "node:crypto";

import { config } from "@basango/domain/config";
import * as bcrypt from "bcrypt";

function getKey(): Buffer {
  const key = config.encryption.key;

  if (Buffer.from(key, "hex").length !== 32) {
    throw new Error("BASANGO_ENCRYPTION_KEY must be a 64-character hex string (32 bytes).");
  }
  return Buffer.from(key, "hex");
}

const getEncryptionSettings = () => ({
  algorithm: config.encryption.algorithm as crypto.CipherGCMTypes,
  authTagLength: config.encryption.authTagLength,
  ivLength: config.encryption.ivLength,
});

/**
 * Encrypts a plaintext string using AES-256-GCM.
 * @param text The plaintext string to encrypt.
 * @returns A string containing the IV, auth tag, and encrypted text, concatenated and base64 encoded.
 */
export function encrypt(text: string): string {
  const key = getKey();
  const { algorithm, ivLength } = getEncryptionSettings();
  const iv = crypto.randomBytes(ivLength);
  const cipher = crypto.createCipheriv(algorithm, key, iv);

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
  const { algorithm, authTagLength, ivLength } = getEncryptionSettings();
  const dataBuffer = Buffer.from(encryptedPayload, "base64");

  // Extract IV, auth tag, and encrypted data
  const iv = dataBuffer.subarray(0, ivLength);
  const authTag = dataBuffer.subarray(ivLength, ivLength + authTagLength);
  const encryptedText = dataBuffer.subarray(ivLength + authTagLength);

  const decipher = crypto.createDecipheriv(algorithm, key, iv);
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
  const rounds = config.encryption.bcryptSaltRounds;
  return bcrypt.hash(password, rounds);
}

export async function verifyPassword(password: string, hashed: string): Promise<boolean> {
  return bcrypt.compare(password, hashed);
}
