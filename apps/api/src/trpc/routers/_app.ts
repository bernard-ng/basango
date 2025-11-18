import type { inferRouterInputs, inferRouterOutputs } from "@trpc/server";

import { createTRPCRouter } from "#api/trpc/init";
import { articlesRouter } from "#api/trpc/routers/articles";
import { authRouter } from "#api/trpc/routers/auth";
import { reportsRouter } from "#api/trpc/routers/reports.js";
import { sourcesRouter } from "#api/trpc/routers/sources";

export const appRouter = createTRPCRouter({
  articles: articlesRouter,
  auth: authRouter,
  reports: reportsRouter,
  sources: sourcesRouter,
});

export type AppRouter = typeof appRouter;
export type RouterOutputs = inferRouterOutputs<AppRouter>;
export type RouterInputs = inferRouterInputs<AppRouter>;
