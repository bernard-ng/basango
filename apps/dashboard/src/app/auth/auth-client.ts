"use client";

import { adminClient } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";

import { getPublicApiUrl } from "#dashboard/app/environment";

export const authClient = createAuthClient({
  basePath: "/api/auth",
  baseURL: getPublicApiUrl(),
  fetchOptions: {
    credentials: "include",
  },
  plugins: [adminClient()],
});

export type AuthSession = typeof authClient.$Infer.Session;

export function hasAdminRole(role?: string | null): boolean {
  return role?.split(",").includes("admin") ?? false;
}
