import type { AppRouter } from "@basango/api/trpc/routers/_app";
import type { QueryClient } from "@tanstack/react-query";
import { createIsomorphicFn } from "@tanstack/react-start";
import { getRequestHeader } from "@tanstack/react-start/server";
import { createTRPCClient, httpBatchLink, loggerLink } from "@trpc/client";
import { createTRPCOptionsProxy } from "@trpc/tanstack-react-query";
import superjson from "superjson";

import { getPublicApiUrl } from "#dashboard/app/environment";

export function createTRPCOptions(queryClient: QueryClient) {
  return createTRPCOptionsProxy<AppRouter>({
    client: createTRPCClient<AppRouter>({
      links: [
        httpBatchLink({
          fetch(url, options) {
            return fetch(url, {
              ...options,
              credentials: "include",
            });
          },
          async headers() {
            const cookie = await getCookieHeader();

            return cookie ? { cookie } : {};
          },
          transformer: superjson,
          url: `${getPublicApiUrl()}/trpc`,
        }),
        loggerLink({
          enabled: (opts) =>
            import.meta.env.DEV || (opts.direction === "down" && opts.result instanceof Error),
        }),
      ],
    }),
    queryClient,
  });
}

const getCookieHeader = createIsomorphicFn()
  .client(() => undefined)
  .server(() => getRequestHeader("cookie"));
