import { createRouter } from "@tanstack/react-router";
import { routerWithQueryClient } from "@tanstack/react-router-with-query";

import { TRPCReactProvider } from "#dashboard/trpc/client";
import { createTRPCOptions } from "#dashboard/trpc/options";
import { makeQueryClient } from "#dashboard/trpc/query-client";

import { routeTree } from "./routeTree.gen";

export function getRouter() {
  const queryClient = makeQueryClient();
  const router = createRouter({
    context: {
      queryClient,
      trpc: createTRPCOptions(queryClient),
    },
    routeTree,
    scrollRestoration: true,
  });

  return routerWithQueryClient(router, queryClient, {
    WrapProvider: ({ children }) => (
      <TRPCReactProvider queryClient={queryClient}>{children}</TRPCReactProvider>
    ),
  });
}

declare module "@tanstack/react-router" {
  interface Register {
    router: ReturnType<typeof getRouter>;
  }
}
