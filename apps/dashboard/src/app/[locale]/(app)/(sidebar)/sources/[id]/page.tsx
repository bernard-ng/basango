import { Tabs, TabsContent, TabsList, TabsTrigger } from "@basango/ui/components/tabs";
import { Metadata } from "next";

import { SourceCategorySharesChart } from "#dashboard/components/charts/source-category-shares-chart";
import { SourcePublicationgGraphChart } from "#dashboard/components/charts/source-publication-graph-chart";
import { PageLayout } from "#dashboard/components/shell/page-layout";
import { HydrateClient, batchPrefetch, getQueryClient, trpc } from "#dashboard/trpc/server";

export const metadata: Metadata = {
  title: "Source Details | Basango Dashboard",
};

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const queryClient = getQueryClient();

  batchPrefetch([
    trpc.sources.getById.queryOptions({ id }),
    trpc.sources.getCategoryShares.queryOptions({ id }),
    trpc.sources.getPublicationGraph.queryOptions({ id }),
  ]);

  const source = await queryClient.fetchQuery(trpc.sources.getById.queryOptions({ id }));

  return (
    <HydrateClient>
      <PageLayout leading={source.description ?? "No description available"} title={source.name}>
        <Tabs className="space-y-4" defaultValue="overview">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="articles">Articles</TabsTrigger>
          </TabsList>
          <TabsContent className="space-y-4" value="overview">
            <SourceCategorySharesChart sourceId={source.id} />
            <SourcePublicationgGraphChart sourceId={source.id} />
          </TabsContent>
          <TabsContent value="articles">
            <div className="flex flex-1 flex-col gap-4">
              <div className="grid auto-rows-min gap-4 md:grid-cols-3">
                <div className="bg-muted/50 aspect-video rounded-xl" />
                <div className="bg-muted/50 aspect-video rounded-xl" />
                <div className="bg-muted/50 aspect-video rounded-xl" />
              </div>
              <div className="bg-muted/50 min-h-screen flex-1 rounded-xl md:min-h-min" />
            </div>
          </TabsContent>
        </Tabs>
      </PageLayout>
    </HydrateClient>
  );
}
