import { describe, expect, test } from "bun:test";

import {
  loginSchema,
  passwordSchema,
  requestPasswordResetSchema,
} from "../../../packages/domain/src/models/auth";

describe("authentication schemas", () => {
  test("normalizes login and reset email addresses", () => {
    expect(loginSchema.parse({ email: " USER@Example.COM ", password: "password" }).email).toBe(
      "user@example.com",
    );
    expect(requestPasswordResetSchema.parse({ email: " USER@Example.COM " }).email).toBe(
      "user@example.com",
    );
  });

  test("enforces Better Auth password length limits", () => {
    expect(passwordSchema.safeParse("short").success).toBe(false);
    expect(passwordSchema.safeParse("a".repeat(73)).success).toBe(false);
    expect(passwordSchema.safeParse("new-password").success).toBe(true);
  });
});
