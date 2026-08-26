import { createFileRoute } from "@tanstack/react-router";

import { requireAdminSession } from "#dashboard/app/auth/route-guards";
import { ArticlesPage } from "#dashboard/features/content/articles/pages/articles-page";

export const Route = createFileRoute("/articles/")({
  beforeLoad: ({ location }) => requireAdminSession(location.href),
  loader: ({ context }) => {
    void context.queryClient.prefetchInfiniteQuery(
      context.trpc.articles.list.infiniteQueryOptions(
        { limit: 12 },
        { getNextPageParam: (lastPage) => lastPage.meta.nextCursor, initialCursor: null },
      ),
    );
    void context.queryClient.prefetchQuery(context.trpc.categories.list.queryOptions());
  },
  head: () => ({
    meta: [{ title: "Articles | Basango Dashboard" }],
  }),
  component: ArticlesPage,
});
