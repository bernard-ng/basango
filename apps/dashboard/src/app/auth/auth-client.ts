"use client";

import { adminClient } from "better-auth/client/plugins";
import { type ReactAuthClient, createAuthClient } from "better-auth/react";

import { getPublicApiUrl } from "#dashboard/app/environment";

type DashboardAuthClientOptions = {
  basePath: string;
  baseURL: string;
  fetchOptions: {
    credentials: "include";
  };
  plugins: [ReturnType<typeof adminClient<Record<never, never>>>];
};

export const authClient: ReactAuthClient<DashboardAuthClientOptions> =
  createAuthClient<DashboardAuthClientOptions>({
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
