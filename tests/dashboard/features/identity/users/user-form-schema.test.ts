import { describe, expect, test } from "bun:test";

import {
  createUserFormSchema,
  getBanDurationSeconds,
  setUserPasswordFormSchema,
} from "../../../../../apps/dashboard/src/features/identity/users/user-form-schema";

describe("user management forms", () => {
  test("normalizes account details and accepts a supported role", () => {
    const result = createUserFormSchema.parse({
      confirmPassword: "a secure password",
      email: "  ADMIN@Example.com ",
      name: "  Admin User ",
      password: "a secure password",
      role: "admin",
    });

    expect(result).toMatchObject({
      email: "admin@example.com",
      name: "Admin User",
      role: "admin",
    });
  });

  test("requires matching passwords", () => {
    const result = setUserPasswordFormSchema.safeParse({
      confirmPassword: "another password",
      password: "a secure password",
    });

    expect(result.success).toBe(false);
  });

  test("maps temporary and permanent ban durations", () => {
    expect(getBanDurationSeconds("day")).toBe(86_400);
    expect(getBanDurationSeconds("week")).toBe(604_800);
    expect(getBanDurationSeconds("month")).toBe(2_592_000);
    expect(getBanDurationSeconds("permanent")).toBeUndefined();
  });
});
