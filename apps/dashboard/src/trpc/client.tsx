"use client";

import type { AppRouter } from "@basango/api/trpc/routers/_app";
import type { QueryClient } from "@tanstack/react-query";
import { createTRPCClient, httpBatchLink } from "@trpc/client";
import { createTRPCContext } from "@trpc/tanstack-react-query";
import { useState } from "react";
import superjson from "superjson";

import { getClientAccessToken } from "#dashboard/utils/auth/client";
import { getPublicApiUrl } from "#dashboard/utils/environment";

export const { TRPCProvider, useTRPC } = createTRPCContext<AppRouter>();

export function TRPCReactProvider(
  props: Readonly<{
    children: React.ReactNode;
    queryClient: QueryClient;
  }>,
) {
  const [trpcClient] = useState(() =>
    createTRPCClient<AppRouter>({
      links: [
        httpBatchLink({
          headers: async () => {
            const token = getClientAccessToken();
            return token
              ? {
                  Authorization: `Bearer ${token}`,
                }
              : {};
          },
          transformer: superjson,
          url: `${getPublicApiUrl()}/trpc`,
        }),
      ],
    }),
  );

  return (
    <TRPCProvider queryClient={props.queryClient} trpcClient={trpcClient}>
      {props.children}
    </TRPCProvider>
  );
}
