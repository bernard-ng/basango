"use client";

import {
  DEFAULT_ACCESS_TOKEN_COOKIE,
  DEFAULT_REFRESH_TOKEN_COOKIE,
} from "@basango/domain/constants";

type PersistTokensParams = {
  accessToken: string;
  refreshToken: string;
  accessTokenExpiresAt: string;
  refreshTokenExpiresAt: string;
};

export function getClientAccessToken() {
  return readCookie(DEFAULT_ACCESS_TOKEN_COOKIE);
}

export function getClientRefreshToken() {
  return readCookie(DEFAULT_REFRESH_TOKEN_COOKIE);
}

export function persistSessionTokens(tokens: PersistTokensParams) {
  setCookie(DEFAULT_ACCESS_TOKEN_COOKIE, tokens.accessToken, tokens.accessTokenExpiresAt);
  setCookie(DEFAULT_REFRESH_TOKEN_COOKIE, tokens.refreshToken, tokens.refreshTokenExpiresAt);
}

export function clearSessionTokens() {
  deleteCookie(DEFAULT_ACCESS_TOKEN_COOKIE);
  deleteCookie(DEFAULT_REFRESH_TOKEN_COOKIE);
}

function readCookie(name: string) {
  const cookies = document.cookie.split(";").map((cookie) => cookie.trim());
  const cookie = cookies.find((item) => item.startsWith(`${name}=`));
  return cookie ? decodeURIComponent(cookie.slice(name.length + 1)) : undefined;
}

function setCookie(name: string, value: string, expiresAt: string) {
  const expires = new Date(expiresAt).toUTCString();
  const secure = window.location.protocol === "https:" ? "; Secure" : "";
  const encodedValue = encodeURIComponent(value);
  document.cookie = `${name}=${encodedValue}; Expires=${expires}; Path=/; SameSite=Lax${secure}`;
}

function deleteCookie(name: string) {
  const secure = window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${name}=; Expires=Thu, 01 Jan 1970 00:00:00 GMT; Path=/; SameSite=Lax${secure}`;
}
