import { createFileRoute } from "@tanstack/react-router";

import { requireAdminSession } from "#dashboard/app/auth/route-guards";
import { CategoriesPage } from "#dashboard/features/content/categories/pages/categories-page";

export const Route = createFileRoute("/categories")({
  beforeLoad: ({ location }) => requireAdminSession(location.href),
  loader: ({ context }) => {
    void context.queryClient.prefetchQuery(context.trpc.categories.list.queryOptions());
    void context.queryClient.prefetchQuery(context.trpc.categories.stats.queryOptions());
  },
  head: () => ({
    meta: [{ title: "Categories | Basango Dashboard" }],
  }),
  component: CategoriesPage,
});
