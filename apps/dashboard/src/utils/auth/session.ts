import type { AppRouter } from "@basango/api/trpc/routers/_app";
import {
  DEFAULT_ACCESS_TOKEN_COOKIE,
  DEFAULT_REFRESH_TOKEN_COOKIE,
} from "@basango/domain/constants";
import { createTRPCProxyClient, httpBatchLink } from "@trpc/client";
import superjson from "superjson";

import { getPublicApiUrl } from "#dashboard/utils/environment";

export type SessionTokens = {
  accessToken: string;
  refreshToken: string;
  accessTokenExpiresAt: string;
  refreshTokenExpiresAt: string;
};

const client = createTRPCProxyClient<AppRouter>({
  links: [
    httpBatchLink({
      transformer: superjson,
      url: `${getPublicApiUrl()}/trpc`,
    }),
  ],
});

export async function refreshSession(refreshToken: string): Promise<SessionTokens | null> {
  try {
    return await client.auth.refresh.mutate({ refreshToken });
  } catch {
    return null;
  }
}

export function getSessionCookieOptions(expiresAt: string, requestUrl: string) {
  return {
    expires: new Date(expiresAt),
    path: "/",
    sameSite: "lax" as const,
    secure: new URL(requestUrl).protocol === "https:",
  };
}

export { DEFAULT_ACCESS_TOKEN_COOKIE, DEFAULT_REFRESH_TOKEN_COOKIE };
