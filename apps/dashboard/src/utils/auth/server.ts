import "server-only";

import { cookies } from "next/headers";

import { DEFAULT_ACCESS_TOKEN_COOKIE, DEFAULT_REFRESH_TOKEN_COOKIE } from "#domain/constants";

export async function getServerAccessToken() {
  const cookiesStore = await cookies();
  return cookiesStore.get(DEFAULT_ACCESS_TOKEN_COOKIE)?.value;
}

export async function getServerRefreshToken() {
  const cookiesStore = await cookies();
  return cookiesStore.get(DEFAULT_REFRESH_TOKEN_COOKIE)?.value;
}
