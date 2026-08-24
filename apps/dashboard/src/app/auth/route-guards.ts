import { redirect } from "@tanstack/react-router";

import { authClient, hasAdminRole } from "./auth-client";

export async function requireAdminSession(returnTo: string) {
  if (typeof document === "undefined") {
    return;
  }

  const session = await authClient.getSession();

  if (!session.data || !hasAdminRole(session.data.user.role)) {
    throw redirect({
      search: { return_to: returnTo },
      to: "/login",
    });
  }
}
