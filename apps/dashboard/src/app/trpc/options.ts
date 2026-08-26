import type { AppRouter } from "@basango/api/trpc/routers/_app";
import type { QueryClient } from "@tanstack/react-query";
import { createIsomorphicFn } from "@tanstack/react-start";
import { getRequestHeader } from "@tanstack/react-start/server";
import { createTRPCClient, httpBatchLink, httpLink, loggerLink, splitLink } from "@trpc/client";
import { createTRPCOptionsProxy } from "@trpc/tanstack-react-query";
import superjson from "superjson";

import { getPublicApiUrl } from "#dashboard/app/environment";

export function createTRPCOptions(queryClient: QueryClient) {
  return createTRPCOptionsProxy<AppRouter>({
    client: createTRPCClient<AppRouter>({
      links: [
        loggerLink({
          enabled: (opts) =>
            import.meta.env.DEV || (opts.direction === "down" && opts.result instanceof Error),
        }),
        splitLink({
          condition: (operation) => operation.context.realtime === true,
          false: httpBatchLink(createHttpLinkOptions()),
          true: httpLink(createHttpLinkOptions()),
        }),
      ],
    }),
    queryClient,
  });
}

function createHttpLinkOptions() {
  return {
    fetch: authenticatedFetch,
    headers: async () => {
      const cookie = await getCookieHeader();

      return cookie ? { cookie } : {};
    },
    transformer: superjson,
    url: `${getPublicApiUrl()}/trpc`,
  };
}

function authenticatedFetch(url: RequestInfo | URL, options?: RequestInit) {
  return fetch(url, {
    ...options,
    credentials: "include",
    redirect: "manual",
  });
}

const getCookieHeader = createIsomorphicFn()
  .client(() => undefined)
  .server(() => getRequestHeader("cookie"));
