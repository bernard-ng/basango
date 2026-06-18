import type { AppRouter } from "@basango/api/trpc/routers/_app";
import { DEFAULT_ACCESS_TOKEN_COOKIE } from "@basango/domain/constants";
import type { QueryClient } from "@tanstack/react-query";
import { createIsomorphicFn } from "@tanstack/react-start";
import { getCookie } from "@tanstack/react-start/server";
import { createTRPCClient, httpBatchLink, loggerLink } from "@trpc/client";
import { createTRPCOptionsProxy } from "@trpc/tanstack-react-query";
import superjson from "superjson";

import { getClientAccessToken } from "#dashboard/utils/auth/client";
import { getPublicApiUrl } from "#dashboard/utils/environment";

export function createTRPCOptions(queryClient: QueryClient) {
  return createTRPCOptionsProxy<AppRouter>({
    client: createTRPCClient<AppRouter>({
      links: [
        httpBatchLink({
          async headers() {
            const token = await getAccessToken();

            return token ? { Authorization: `Bearer ${token}` } : {};
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

const getAccessToken = createIsomorphicFn()
  .client(() => getClientAccessToken())
  .server(() => getCookie(DEFAULT_ACCESS_TOKEN_COOKIE));
