import type { inferRouterInputs, inferRouterOutputs } from "@trpc/server";

import { createTRPCRouter } from "@/trpc/init";
import { sourcesRouter } from "@/trpc/routers/sources";

export const appRouter = createTRPCRouter({
  sources: sourcesRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;
export type RouterOutputs = inferRouterOutputs<AppRouter>;
export type RouterInputs = inferRouterInputs<AppRouter>;
