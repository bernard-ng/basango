/** biome-ignore-all lint/suspicious/noExplicitAny: needed for tRPC type inference */
import "server-only";

import type { AppRouter } from "@basango/api/trpc/routers/_app";
import { HydrationBoundary, dehydrate } from "@tanstack/react-query";
import { createTRPCClient, httpBatchLink, loggerLink } from "@trpc/client";
import {
  type TRPCInfiniteQueryOptions,
  type TRPCQueryOptions,
  createTRPCOptionsProxy,
} from "@trpc/tanstack-react-query";
import { cache } from "react";
import superjson from "superjson";

import { getServerAccessToken } from "#dashboard/utils/auth/server";

import { makeQueryClient } from "./query-client";

// IMPORTANT: Create a stable getter for the query client that
//            will return the same client during the same request.
export const getQueryClient = cache(makeQueryClient);

export const trpc = createTRPCOptionsProxy<AppRouter>({
  client: createTRPCClient({
    links: [
      httpBatchLink({
        async headers() {
          const token = await getServerAccessToken();

          return token
            ? {
                Authorization: `Bearer ${token}`,
                // "x-user-country": await getCountryCode(),
                // "x-user-locale": await getLocale(),
                // "x-user-timezone": await getTimezone(),
              }
            : {};
        },
        transformer: superjson,
        url: `${process.env.NEXT_PUBLIC_API_URL}/trpc`,
      }),
      loggerLink({
        enabled: (opts) =>
          process.env.NODE_ENV === "development" ||
          (opts.direction === "down" && opts.result instanceof Error),
      }),
    ],
  }),
  queryClient: getQueryClient,
});

export function HydrateClient(props: { children: React.ReactNode }) {
  const queryClient = getQueryClient();
  return <HydrationBoundary state={dehydrate(queryClient)}>{props.children}</HydrationBoundary>;
}

type AnyQueryOptions =
  | ReturnType<TRPCQueryOptions<any>>
  | ReturnType<TRPCInfiniteQueryOptions<any>>;

export function prefetch<T extends AnyQueryOptions>(queryOptions: T) {
  const queryClient = getQueryClient();
  const meta = queryOptions.queryKey[1];
  if (!Array.isArray(meta) && meta?.type === "infinite") {
    void queryClient.prefetchInfiniteQuery(queryOptions as any);
  } else {
    void queryClient.prefetchQuery(queryOptions as any);
  }
}
export function batchPrefetch<T extends AnyQueryOptions>(queryOptionsArray: T[]) {
  const queryClient = getQueryClient();

  for (const queryOptions of queryOptionsArray) {
    const meta = queryOptions.queryKey[1];
    if (!Array.isArray(meta) && meta?.type === "infinite") {
      void queryClient.prefetchInfiniteQuery(queryOptions as any);
    } else {
      void queryClient.prefetchQuery(queryOptions as any);
    }
  }
}
