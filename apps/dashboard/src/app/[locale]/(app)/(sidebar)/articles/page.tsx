import { Metadata } from "next";

import { ArticlesFeed } from "#dashboard/components/articles-feed";
import { CategoriesCarousel } from "#dashboard/components/categories-carousel";
import { PageHeader } from "#dashboard/components/shell/page-header";
import { PageLayout } from "#dashboard/components/shell/page-layout";
import { HydrateClient, batchPrefetch, trpc } from "#dashboard/trpc/server";

export const metadata: Metadata = {
  title: "Articles | Basango Dashboard",
};

export default function Page() {
  batchPrefetch([
    trpc.articles.list.infiniteQueryOptions({ limit: 12 }),
    trpc.categories.list.queryOptions(),
  ]);

  return (
    <HydrateClient>
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
    </HydrateClient>
  );
}
