import {
  DEFAULT_ACCESS_TOKEN_COOKIE,
  DEFAULT_REFRESH_TOKEN_COOKIE,
} from "@basango/domain/constants";
import { type NextRequest, NextResponse } from "next/server";
import { createI18nMiddleware } from "next-international/middleware";

const SUPPORTED_LOCALES = ["en"] as const;
const DEFAULT_LOCALE = SUPPORTED_LOCALES[0];

const I18nMiddleware = createI18nMiddleware({
  defaultLocale: DEFAULT_LOCALE,
  locales: SUPPORTED_LOCALES as unknown as string[],
  urlMappingStrategy: "rewrite",
});

const PUBLIC_PATHS = new Set(["/login"]);

type SessionTokens = {
  accessToken: string;
  refreshToken: string;
  accessTokenExpiresAt: string;
  refreshTokenExpiresAt: string;
};

export default async function proxy(request: NextRequest) {
  const { locale, pathname } = extractLocaleAndPath(request);
  let accessToken = request.cookies.get(DEFAULT_ACCESS_TOKEN_COOKIE)?.value;
  const refreshToken = request.cookies.get(DEFAULT_REFRESH_TOKEN_COOKIE)?.value;
  const isPublicRoute = PUBLIC_PATHS.has(pathname);
  let refreshedTokens: SessionTokens | null = null;

  if (!accessToken && refreshToken) {
    refreshedTokens = await refreshSession(request);
    accessToken = refreshedTokens?.accessToken;
  }

  if (!isPublicRoute && !accessToken) {
    return redirectToLogin(request, locale);
  }

  if (accessToken && pathname === "/login") {
    const redirectUrl = new URL(`/${locale}/dashboard`, request.url);
    return NextResponse.redirect(redirectUrl);
  }

  const i18nResponse = await I18nMiddleware(request);

  if (refreshedTokens) {
    setSessionCookies(i18nResponse, refreshedTokens, request);
  }

  return i18nResponse;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api).*)"],
};

function extractLocaleAndPath(request: NextRequest) {
  const segments = request.nextUrl.pathname.split("/").filter(Boolean);
  const maybeLocale = segments[0];
  const localeFromPath =
    maybeLocale && SUPPORTED_LOCALES.find((supportedLocale) => supportedLocale === maybeLocale);
  const locale = localeFromPath ?? DEFAULT_LOCALE;
  const pathSegments = localeFromPath ? segments.slice(1) : segments;
  const pathname = `/${pathSegments.join("/")}`.replace(/\/+/g, "/") || "/";

  return { locale, pathname };
}

function redirectToLogin(request: NextRequest, locale: string) {
  const target = new URL(`/${locale}/login`, request.url);
  const returnTo = buildReturnToParam(request);

  if (returnTo) {
    target.searchParams.set("return_to", returnTo);
  }

  return NextResponse.redirect(target);
}

function buildReturnToParam(request: NextRequest) {
  const path = `${request.nextUrl.pathname}${request.nextUrl.search}`;
  return path !== "/" ? path : null;
}

async function refreshSession(request: NextRequest): Promise<SessionTokens | null> {
  try {
    const response = await fetch(new URL("/api/session/refresh", request.url), {
      headers: {
        cookie: request.headers.get("cookie") ?? "",
      },
      method: "POST",
    });

    if (!response.ok) {
      return null;
    }

    return (await response.json()) as SessionTokens;
  } catch {
    return null;
  }
}

function setSessionCookies(response: NextResponse, tokens: SessionTokens, request: NextRequest) {
  const secure = request.nextUrl.protocol === "https:";

  response.cookies.set({
    expires: new Date(tokens.accessTokenExpiresAt),
    name: DEFAULT_ACCESS_TOKEN_COOKIE,
    path: "/",
    sameSite: "lax",
    secure,
    value: tokens.accessToken,
  });

  response.cookies.set({
    expires: new Date(tokens.refreshTokenExpiresAt),
    name: DEFAULT_REFRESH_TOKEN_COOKIE,
    path: "/",
    sameSite: "lax",
    secure,
    value: tokens.refreshToken,
  });
}
