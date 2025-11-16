import { Metadata } from "next";

import { ArticlesFeed } from "#dashboard/components/articles-feed";
import { PageLayout } from "#dashboard/components/shell/page-layout";
import { HydrateClient, batchPrefetch, trpc } from "#dashboard/trpc/server";

export const metadata: Metadata = {
  title: "Articles | Basango Dashboard",
};

export default function Page() {
  batchPrefetch([trpc.articles.list.infiniteQueryOptions({ limit: 12 })]);

  return (
    <HydrateClient>
      <PageLayout leading="Track crawled content and trends" title="Articles">
        <ArticlesFeed />
      </PageLayout>
    </HydrateClient>
  );
}
