"use client";

import type { AppRouter } from "@basango/api/trpc/routers/_app";
import type { QueryClient } from "@tanstack/react-query";
import { createTRPCClient, httpBatchLink, httpLink, splitLink } from "@trpc/client";
import { createTRPCContext } from "@trpc/tanstack-react-query";
import { useState } from "react";
import superjson from "superjson";

import { getPublicApiUrl } from "#dashboard/app/environment";

const { TRPCProvider, useTRPC: useTRPCContext } = createTRPCContext<AppRouter>();

export const useTRPC = useTRPCContext;

export function TRPCReactProvider(
  props: Readonly<{
    children: React.ReactNode;
    queryClient: QueryClient;
  }>,
) {
  const [trpcClient] = useState(() =>
    createTRPCClient<AppRouter>({
      links: [
        splitLink({
          condition: (operation) => operation.context.realtime === true,
          false: httpBatchLink({
            fetch: authenticatedFetch,
            transformer: superjson,
            url: `${getPublicApiUrl()}/trpc`,
          }),
          true: httpLink({
            fetch: authenticatedFetch,
            transformer: superjson,
            url: `${getPublicApiUrl()}/trpc`,
          }),
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

function authenticatedFetch(url: RequestInfo | URL, options?: RequestInit) {
  return fetch(url, {
    ...options,
    credentials: "include",
    redirect: "manual",
  });
}
