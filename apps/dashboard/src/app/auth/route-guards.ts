import { redirect } from "@tanstack/react-router";

import { authClient, hasAdminRole } from "./auth-client";

type SessionLoader = () => ReturnType<typeof authClient.getSession>;

export async function requireAdminSession(returnTo: string) {
  if (typeof document === "undefined") {
    return;
  }

  const isAdmin = await hasAdminSession();

  if (!isAdmin) {
    throw redirect({
      search: { return_to: returnTo },
      to: "/login",
    });
  }
}

export async function hasAdminSession(
  loadSession: SessionLoader = () => authClient.getSession(),
): Promise<boolean> {
  try {
    const session = await loadSession();

    return hasAdminRole(session.data?.user.role);
  } catch {
    return false;
  }
}
