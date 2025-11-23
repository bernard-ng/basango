import z from "zod";

import {
  DEFAULT_AUTH_TAG_LENGTH,
  DEFAULT_BCRYPT_SALT_ROUNDS,
  DEFAULT_IV_LENGTH,
} from "../constants";

export const EncryptionConfigurationSchema = z.object({
  algorithm: z.enum(["aes-128-gcm", "aes-192-gcm", "aes-256-gcm"]),
  authTagLength: z.number().nonnegative().default(DEFAULT_AUTH_TAG_LENGTH),
  bcryptSaltRounds: z.number().nonnegative().default(DEFAULT_BCRYPT_SALT_ROUNDS),
  ivLength: z.number().nonnegative().default(DEFAULT_IV_LENGTH),
  key: z.string(),
});

// types
export type EncryptionConfiguration = z.infer<typeof EncryptionConfigurationSchema>;
