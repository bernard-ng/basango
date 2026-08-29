import type { inferRouterInputs, inferRouterOutputs } from "@trpc/server";

import { createTRPCRouter } from "#api/trpc/init";
import { articlesRouter } from "#api/trpc/routers/articles";
import { categoriesRouter } from "#api/trpc/routers/categories";
import { feedRouter } from "#api/trpc/routers/feed";
import { operationsRouter } from "#api/trpc/routers/operations";
import { reportsRouter } from "#api/trpc/routers/reports";
import { sourcesRouter } from "#api/trpc/routers/sources";

export const appRouter = createTRPCRouter({
  articles: articlesRouter,
  categories: categoriesRouter,
  feed: feedRouter,
  operations: operationsRouter,
  reports: reportsRouter,
  sources: sourcesRouter,
});

export type AppRouter = typeof appRouter;
export type RouterOutputs = inferRouterOutputs<AppRouter>;
export type RouterInputs = inferRouterInputs<AppRouter>;
