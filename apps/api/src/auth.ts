import { db } from "@basango/db/client";
import { accounts, sessions, users, verifications } from "@basango/db/schema";
import { config, env } from "@basango/domain/config";
import { logger } from "@basango/logger";
import { drizzleAdapter } from "@better-auth/drizzle-adapter";
import { betterAuth } from "better-auth";
import { admin } from "better-auth/plugins";
import { v7 as uuidv7 } from "uuid";

import { sendPasswordResetEmail } from "#api/utils/password-reset-email";

const isProduction = env.NODE_ENV === "prod";
const baseURL = env.BETTER_AUTH_URL?.trim() ?? `http://localhost:${config.api.server.port}`;
const cookieDomain = env.BETTER_AUTH_COOKIE_DOMAIN?.trim();
const secret =
  env.BETTER_AUTH_SECRET?.trim() ??
  (isProduction ? undefined : "basango-local-better-auth-secret-change-me");

if (!secret) {
  throw new Error("BETTER_AUTH_SECRET is required in production.");
}

export const auth = betterAuth({
  advanced: {
    database: {
      generateId: () => uuidv7(),
    },
    ...(cookieDomain
      ? {
          crossSubDomainCookies: {
            domain: cookieDomain,
            enabled: true,
          },
        }
      : {}),
  },
  appName: "Basango",
  basePath: "/api/auth",
  baseURL,
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: {
      account: accounts,
      session: sessions,
      user: users,
      verification: verifications,
    },
  }),
  emailAndPassword: {
    disableSignUp: true,
    enabled: true,
    maxPasswordLength: 72,
    minPasswordLength: 8,
    resetPasswordTokenExpiresIn: 30 * 60,
    revokeSessionsOnPasswordReset: true,
    sendResetPassword: async ({ token, url, user }) => {
      void sendPasswordResetEmail({
        email: user.email,
        name: user.name,
        token,
        url,
      }).catch((error: unknown) => {
        logger.error({ email: user.email, error }, "Unable to deliver password reset email");
      });
    },
  },
  plugins: [
    admin({
      adminRoles: ["admin"],
      defaultRole: "user",
    }),
  ] as const,
  secret,
  session: {
    expiresIn: 60 * 60 * 24 * 7,
    updateAge: 60 * 60 * 24,
  },
  trustedOrigins: [...config.api.cors.origin],
});

export type AuthSession = typeof auth.$Infer.Session;

export function isAdmin(session: AuthSession | null): boolean {
  return session?.user.role?.split(",").includes("admin") ?? false;
}
