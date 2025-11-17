import { Tabs, TabsContent, TabsList, TabsTrigger } from "@basango/ui/components/tabs";
import { Metadata } from "next";

import { ArticlesFeed } from "#dashboard/components/articles-feed";
import { CategorySharesChart } from "#dashboard/components/charts/sources/category-shares-chart";
import { PublicationGraphChart } from "#dashboard/components/charts/sources/publication-graph-chart";
import { PageLayout } from "#dashboard/components/shell/page-layout";
import { SourceDetailsTab } from "#dashboard/components/source-details-tab";
import { HydrateClient, batchPrefetch, getQueryClient, trpc } from "#dashboard/trpc/server";

export const metadata: Metadata = {
  title: "Source Details | Basango Dashboard",
};

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const queryClient = getQueryClient();

  batchPrefetch([
    trpc.sources.getById.queryOptions({ id }),
    trpc.sources.getCategoryShares.queryOptions({ id, limit: 10 }),
    trpc.sources.getPublications.queryOptions({ id }),
    trpc.articles.list.infiniteQueryOptions({ limit: 12, sourceId: id }),
  ]);

  const source = await queryClient.fetchQuery(trpc.sources.getById.queryOptions({ id }));

  return (
    <HydrateClient>
      <PageLayout leading={source.description ?? "No description available"} title={source.name}>
        <Tabs className="space-y-4" defaultValue="overview">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="articles">Articles</TabsTrigger>
            <TabsTrigger value="details">Details</TabsTrigger>
          </TabsList>
          <TabsContent className="space-y-4" value="overview">
            <CategorySharesChart sourceId={source.id} />
            <PublicationGraphChart sourceId={source.id} />
          </TabsContent>
          <TabsContent value="articles">
            <ArticlesFeed sourceId={source.id} />
          </TabsContent>
          <TabsContent value="details">
            <SourceDetailsTab source={source} />
          </TabsContent>
        </Tabs>
      </PageLayout>
    </HydrateClient>
  );
}
