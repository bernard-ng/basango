"use client";

import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";

import { useUserStore } from "#dashboard/stores/user-store";
import { useTRPC } from "#dashboard/trpc/client";

export function useUser() {
  const trpc = useTRPC();
  const { user, setUser } = useUserStore();

  const queryOptions = trpc.auth.session.queryOptions();
  const query = useQuery({
    ...queryOptions,
    enabled: queryOptions.enabled ?? !user,
    staleTime: queryOptions.staleTime ?? 5 * 60 * 1000,
  });

  useEffect(() => {
    if (query.data) {
      setUser(query.data);
    } else if (query.isError) {
      setUser(null);
    }
  }, [query.data, query.isError, setUser]);

  return {
    ...query,
    setUser,
    user,
  };
}
