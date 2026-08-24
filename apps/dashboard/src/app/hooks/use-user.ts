"use client";

import { authClient } from "#dashboard/app/auth/auth-client";

export function useUser() {
  const session = authClient.useSession();

  return {
    ...session,
    user: session.data?.user ?? null,
  };
}
