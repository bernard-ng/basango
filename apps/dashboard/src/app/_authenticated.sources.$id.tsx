import { Tabs, TabsContent, TabsList, TabsTrigger } from "@basango/ui/components/tabs";
import { createFileRoute } from "@tanstack/react-router";

import { ArticlesFeed } from "#dashboard/components/articles-feed";
import { CategorySharesChart } from "#dashboard/components/charts/sources/category-shares-chart";
import { PublicationGraphChart } from "#dashboard/components/charts/sources/publication-graph-chart";
import { PageLayout } from "#dashboard/components/shell/page-layout";
import { SourceDetailsTab } from "#dashboard/components/source-details-tab";

export const Route = createFileRoute("/_authenticated/sources/$id")({
  component: SourceDetailsPage,
  head: () => ({
    meta: [{ title: "Source Details | Basango Dashboard" }],
  }),
  loader: async ({ context, params }) => {
    const sourceQuery = context.trpc.sources.getById.queryOptions({ id: params.id });

    void context.queryClient.prefetchQuery(
      context.trpc.sources.getCategoryShares.queryOptions({ id: params.id, limit: 10 }),
    );
    void context.queryClient.prefetchQuery(
      context.trpc.sources.getPublications.queryOptions({ id: params.id }),
    );
    void context.queryClient.prefetchQuery(context.trpc.categories.list.queryOptions());
    void context.queryClient.prefetchInfiniteQuery(
      context.trpc.articles.list.infiniteQueryOptions({ limit: 12, sourceId: params.id }),
    );

    return context.queryClient.ensureQueryData(sourceQuery);
  },
});

function SourceDetailsPage() {
  const source = Route.useLoaderData();

  return (
    <PageLayout title={source.name}>
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
  );
}
