import { createFileRoute } from "@tanstack/react-router";
import { getCookie } from "@tanstack/react-start/server";

import {
  DEFAULT_ACCESS_TOKEN_COOKIE,
  DEFAULT_REFRESH_TOKEN_COOKIE,
  getSessionCookieOptions,
  refreshSession,
} from "#dashboard/utils/auth/session";

export const Route = createFileRoute("/api/session/refresh")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const refreshToken =
          getCookie(DEFAULT_REFRESH_TOKEN_COOKIE) ?? (await getRefreshTokenFromBody(request));

        if (!refreshToken) {
          return Response.json({ error: "Missing refresh token" }, { status: 401 });
        }

        const tokens = await refreshSession(refreshToken);

        if (!tokens) {
          return Response.json({ error: "Invalid refresh token" }, { status: 401 });
        }

        const response = Response.json(tokens);
        response.headers.append(
          "Set-Cookie",
          serializeCookie(
            DEFAULT_ACCESS_TOKEN_COOKIE,
            tokens.accessToken,
            getSessionCookieOptions(tokens.accessTokenExpiresAt, request.url),
          ),
        );
        response.headers.append(
          "Set-Cookie",
          serializeCookie(
            DEFAULT_REFRESH_TOKEN_COOKIE,
            tokens.refreshToken,
            getSessionCookieOptions(tokens.refreshTokenExpiresAt, request.url),
          ),
        );

        return response;
      },
    },
  },
});

async function getRefreshTokenFromBody(request: Request) {
  try {
    const body = await request.json();

    if (typeof body?.refreshToken === "string") {
      return body.refreshToken;
    }
  } catch {
    // Ignore malformed bodies.
  }

  return undefined;
}

function serializeCookie(
  name: string,
  value: string,
  options: ReturnType<typeof getSessionCookieOptions>,
) {
  const secure = options.secure ? "; Secure" : "";
  return `${name}=${encodeURIComponent(value)}; Expires=${options.expires.toUTCString()}; Path=${options.path}; SameSite=Lax${secure}`;
}
