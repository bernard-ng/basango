import { createFileRoute } from "@tanstack/react-router";

import { ArticlesFeed } from "#dashboard/components/articles-feed";
import { CategoriesCarousel } from "#dashboard/components/categories-carousel";
import { PageHeader } from "#dashboard/components/shell/page-header";
import { PageLayout } from "#dashboard/components/shell/page-layout";

export const Route = createFileRoute("/_authenticated/articles")({
  component: ArticlesPage,
  head: () => ({
    meta: [{ title: "Articles | Basango Dashboard" }],
  }),
  loader: ({ context }) => {
    void context.queryClient.prefetchInfiniteQuery(
      context.trpc.articles.list.infiniteQueryOptions({ limit: 12 }),
    );
    void context.queryClient.prefetchQuery(context.trpc.categories.list.queryOptions());
  },
});

function ArticlesPage() {
  return (
    <PageLayout
      header={
        <>
          <PageHeader title="Articles" />
          <CategoriesCarousel />
        </>
      }
      headersNumber={2}
      title="Articles"
    >
      <ArticlesFeed />
    </PageLayout>
  );
}
