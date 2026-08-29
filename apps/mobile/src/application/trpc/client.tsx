import type { AppRouter } from "@basango/api/trpc/routers/_app";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createTRPCClient, httpBatchLink } from "@trpc/client";
import { createTRPCContext } from "@trpc/tanstack-react-query";
import type { PropsWithChildren } from "react";
import { useEffect, useRef, useState } from "react";
import superjson from "superjson";

import { authClient } from "#mobile/application/auth/auth-client";
import { getPublicApiUrl } from "#mobile/application/environment";

const {
  TRPCProvider,
  useTRPC: useTRPCContext,
  useTRPCClient: useTRPCClientContext,
} = createTRPCContext<AppRouter>();

export const useTRPC = useTRPCContext;
export const useTRPCClient = useTRPCClientContext;

export function DataProvider(props: PropsWithChildren) {
  const session = authClient.useSession();
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            retry: 2,
            staleTime: 30_000,
          },
        },
      }),
  );
  const [trpcClient] = useState(() =>
    createTRPCClient<AppRouter>({
      links: [
        httpBatchLink({
          fetch(url, options) {
            return globalThis.fetch(url, { ...options, credentials: "omit" });
          },
          async headers() {
            const cookie = await authClient.getCookie();

            return cookie ? { Cookie: cookie } : {};
          },
          transformer: superjson,
          url: `${getPublicApiUrl()}/trpc`,
        }),
      ],
    }),
  );
  const activeUserId = useRef(session.data?.user.id);

  useEffect(() => {
    const userId = session.data?.user.id;

    if (activeUserId.current !== userId) {
      queryClient.clear();
      activeUserId.current = userId;
    }
  }, [queryClient, session.data?.user.id]);

  return (
    <QueryClientProvider client={queryClient}>
      <TRPCProvider queryClient={queryClient} trpcClient={trpcClient}>
        {props.children}
      </TRPCProvider>
    </QueryClientProvider>
  );
}
