import { Metadata } from "next";

import { PublicationGraphChart } from "#dashboard/components/charts/articles/publication-graph-chart";
import { SourceDistributionChart } from "#dashboard/components/charts/articles/source-distribution-chart";
import { PageLayout } from "#dashboard/components/shell/page-layout";
import { HydrateClient, batchPrefetch, trpc } from "#dashboard/trpc/server";

export const metadata: Metadata = {
  title: "Dashboard | Basango",
};

export default async function Page() {
  batchPrefetch([
    trpc.articles.getPublicationGraph.queryOptions({}),
    trpc.articles.getSourceDistribution.queryOptions({ limit: 8 }),
  ]);

  return (
    <HydrateClient>
      <PageLayout leading="Keep track of article volume and source coverage" title="Dashboard">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
          <div className="lg:col-span-3">
            <PublicationGraphChart />
          </div>
          <SourceDistributionChart />
        </div>
      </PageLayout>
    </HydrateClient>
  );
}
