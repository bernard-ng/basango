import { createFileRoute } from "@tanstack/react-router";

import { requireAdminSession } from "#dashboard/app/auth/route-guards";
import { articleSearchParamsSchema } from "#dashboard/features/content/articles/article-search-params";
import { ArticleSearchPage } from "#dashboard/features/content/articles/pages/article-search-page";

export const Route = createFileRoute("/search")({
  validateSearch: articleSearchParamsSchema,
  beforeLoad: ({ location }) => requireAdminSession(location.href),
  loaderDeps: ({ search }) => search,
  loader: ({ context, deps }) => {
    void context.queryClient.prefetchQuery(context.trpc.categories.list.queryOptions());
    void context.queryClient.prefetchQuery(
      context.trpc.sources.list.queryOptions({ limit: 100, page: 1 }),
    );

    if (deps.q) {
      void context.queryClient.prefetchQuery(
        context.trpc.articles.search.queryOptions({
          categoryId: deps.category,
          limit: 12,
          page: 1,
          query: deps.q,
          sentiment: deps.sentiment,
          sourceId: deps.source,
        }),
      );
    }
  },
  head: () => ({
    meta: [{ title: "Search | Basango Dashboard" }],
  }),
  component: ArticleSearchPage,
});
