import { createMiddleware, createStart } from "@tanstack/react-start";
import { getCookie, setCookie } from "@tanstack/react-start/server";

import {
  DEFAULT_ACCESS_TOKEN_COOKIE,
  DEFAULT_REFRESH_TOKEN_COOKIE,
  getSessionCookieOptions,
  refreshSession,
} from "#dashboard/utils/auth/session";

const PUBLIC_PATHS = new Set(["/login", "/api/session/refresh"]);

const authMiddleware = createMiddleware({ type: "request" }).server(
  async ({ next, request, pathname, handlerType }) => {
    if (handlerType !== "router" || isStaticAsset(pathname)) {
      return next();
    }

    const localeRedirect = getLocaleRedirect(request);

    if (localeRedirect) {
      return localeRedirect;
    }

    if (pathname.startsWith("/api/")) {
      return next();
    }

    let accessToken = getCookie(DEFAULT_ACCESS_TOKEN_COOKIE);
    const refreshToken = getCookie(DEFAULT_REFRESH_TOKEN_COOKIE);

    if (!accessToken && refreshToken) {
      const tokens = await refreshSession(refreshToken);

      if (tokens) {
        accessToken = tokens.accessToken;
        setSessionCookies(tokens, request.url);
      }
    }

    if (pathname === "/login" && accessToken) {
      return Response.redirect(new URL("/dashboard", request.url));
    }

    if (!PUBLIC_PATHS.has(pathname) && !accessToken) {
      const loginUrl = new URL("/login", request.url);
      const returnTo = `${pathname}${new URL(request.url).search}`;

      if (returnTo !== "/") {
        loginUrl.searchParams.set("return_to", returnTo);
      }

      return Response.redirect(loginUrl);
    }

    const result = await next();
    result.response.headers.set("X-Frame-Options", "DENY");

    return result;
  },
);

export const startInstance = createStart(() => ({
  requestMiddleware: [authMiddleware],
}));

function getLocaleRedirect(request: Request) {
  const url = new URL(request.url);

  if (url.pathname !== "/en" && !url.pathname.startsWith("/en/")) {
    return null;
  }

  const nextPath = url.pathname.replace(/^\/en\/?/, "/") || "/dashboard";
  url.pathname = nextPath === "/" ? "/dashboard" : nextPath;

  return Response.redirect(url);
}

function isStaticAsset(pathname: string) {
  return (
    pathname.startsWith("/assets/") ||
    pathname.startsWith("/_build/") ||
    pathname.startsWith("/__vite") ||
    pathname === "/favicon.ico"
  );
}

function setSessionCookies(
  tokens: NonNullable<Awaited<ReturnType<typeof refreshSession>>>,
  requestUrl: string,
) {
  setCookie(
    DEFAULT_ACCESS_TOKEN_COOKIE,
    tokens.accessToken,
    getSessionCookieOptions(tokens.accessTokenExpiresAt, requestUrl),
  );
  setCookie(
    DEFAULT_REFRESH_TOKEN_COOKIE,
    tokens.refreshToken,
    getSessionCookieOptions(tokens.refreshTokenExpiresAt, requestUrl),
  );
}
