import { createFileRoute } from "@tanstack/react-router";

import { requireAdminSession } from "#dashboard/app/auth/route-guards";
import { ArticlesPage } from "#dashboard/features/content/articles/pages/articles-page";

export const Route = createFileRoute("/articles/")({
  beforeLoad: ({ location }) => requireAdminSession(location.href),
  loader: ({ context }) => {
    void context.queryClient.prefetchQuery(
      context.trpc.articles.list.queryOptions({ limit: 12, page: 1 }),
    );
    void context.queryClient.prefetchQuery(context.trpc.categories.list.queryOptions());
  },
  head: () => ({
    meta: [{ title: "Articles | Basango Dashboard" }],
  }),
  component: ArticlesPage,
});
