import { randomBytes } from "node:crypto";

import { passwordSchema, requestPasswordResetSchema } from "@basango/domain/models";

import type { auth } from "#api/auth";

type PasswordResetAuth = {
  $context: Promise<Pick<Awaited<typeof auth.$context>, "internalAdapter">>;
  api: Pick<typeof auth.api, "resetPassword">;
};

export async function resetUserPassword(
  authServer: PasswordResetAuth,
  email: string,
  newPassword: string,
) {
  const input = requestPasswordResetSchema.extend({ password: passwordSchema }).parse({
    email,
    password: newPassword,
  });
  const { internalAdapter } = await authServer.$context;
  const result = await internalAdapter.findUserByEmail(input.email);

  if (!result) {
    throw new Error(`No user found with email ${input.email}.`);
  }

  // This local operator command has database access; no token is sent or printed.
  // Let Better Auth own hashing, credential creation, hooks, and session revocation.
  const token = randomBytes(32).toString("hex");
  const identifier = `reset-password:${token}`;

  await internalAdapter.createVerificationValue({
    expiresAt: new Date(Date.now() + 60_000),
    identifier,
    value: result.user.id,
  });

  try {
    await authServer.api.resetPassword({ body: { newPassword: input.password, token } });
  } finally {
    await internalAdapter.deleteVerificationByIdentifier(identifier);
  }

  return result.user.email;
}
