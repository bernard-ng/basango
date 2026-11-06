import { describe, expect, test } from "bun:test";

import { betterAuth } from "better-auth";
import { memoryAdapter } from "better-auth/adapters/memory";

import { resetUserPassword } from "../../../apps/api/src/commands/reset-user-password";

function createAuth(minPasswordLength = 8) {
  const database = { account: [], session: [], user: [], verification: [] };
  const auth = betterAuth({
    baseURL: "http://localhost:3080",
    database: memoryAdapter(database),
    emailAndPassword: {
      enabled: true,
      maxPasswordLength: 72,
      minPasswordLength,
      revokeSessionsOnPasswordReset: true,
    },
    logger: { disabled: true },
    secret: "password-reset-command-test-secret-at-least-32-characters",
  });

  return { auth, database };
}

describe("operator password reset", () => {
  test("resets credentials, normalizes email, and revokes existing sessions", async () => {
    const { auth, database } = createAuth();

    await auth.api.signUpEmail({
      body: { email: "reader@example.com", name: "Reader", password: "old-password" },
    });
    expect(database.session.length).toBeGreaterThan(0);

    const email = await resetUserPassword(auth, " Reader@Example.com ", " new-password ");

    expect(email).toBe("reader@example.com");
    expect(database.session).toHaveLength(0);
    expect(database.verification).toHaveLength(0);
    await expect(
      auth.api.signInEmail({ body: { email, password: "old-password" } }),
    ).rejects.toThrow();
    const login = await auth.api.signInEmail({ body: { email, password: " new-password " } });

    expect(login.user.email).toBe(email);
  });

  test("creates credentials for an existing user without a password", async () => {
    const { auth } = createAuth();
    const { internalAdapter } = await auth.$context;

    await internalAdapter.createUser(
      {
        email: "reader@example.com",
        emailVerified: false,
        name: "Reader",
      },
      { method: "test" },
    );
    await resetUserPassword(auth, "reader@example.com", "new-password");
    const login = await auth.api.signInEmail({
      body: { email: "reader@example.com", password: "new-password" },
    });

    expect(login.user.email).toBe("reader@example.com");
    expect(login.user.emailVerified).toBe(false);
  });

  test("does not create a user when the email is unknown", async () => {
    const { auth, database } = createAuth();

    await expect(resetUserPassword(auth, "missing@example.com", "new-password")).rejects.toThrow(
      "No user found",
    );
    expect(database.user).toHaveLength(0);
    expect(database.account).toHaveLength(0);
    expect(database.verification).toHaveLength(0);
  });

  test("rejects invalid input before changing credentials", async () => {
    const { auth, database } = createAuth();

    for (const [email, password] of [
      ["invalid", "new-password"],
      ["reader@example.com", "short"],
      ["reader@example.com", "a".repeat(73)],
    ] as const) {
      await expect(resetUserPassword(auth, email, password)).rejects.toThrow();
    }

    expect(database.account).toHaveLength(0);
    expect(database.verification).toHaveLength(0);
  });

  test("cleans up the temporary token when Better Auth rejects the reset", async () => {
    const { auth, database } = createAuth(20);

    await auth.api.signUpEmail({
      body: {
        email: "reader@example.com",
        name: "Reader",
        password: "original-long-password",
      },
    });
    await expect(resetUserPassword(auth, "reader@example.com", "new-password")).rejects.toThrow();

    expect(database.verification).toHaveLength(0);
    const login = await auth.api.signInEmail({
      body: { email: "reader@example.com", password: "original-long-password" },
    });

    expect(login.user.email).toBe("reader@example.com");
  });
});
