"use client";

import type { AppRouter } from "@basango/api/trpc/routers/_app";
import type { QueryClient } from "@tanstack/react-query";
import { createTRPCClient, httpBatchLink } from "@trpc/client";
import { createTRPCContext } from "@trpc/tanstack-react-query";
import { useState } from "react";
import superjson from "superjson";

import { getPublicApiUrl } from "#dashboard/app/environment";

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
          fetch(url, options) {
            return fetch(url, {
              ...options,
              credentials: "include",
            });
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
