import type { QueryClient } from "@tanstack/react-query";

import type { createTRPCOptions } from "#dashboard/app/trpc/options";

export type RouterContext = {
  queryClient: QueryClient;
  trpc: ReturnType<typeof createTRPCOptions>;
};
