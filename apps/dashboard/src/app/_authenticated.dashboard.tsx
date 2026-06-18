import { createFileRoute } from "@tanstack/react-router";

import { PublicationGraphChart } from "#dashboard/components/charts/articles/publication-graph-chart";
import { SourceDistributionChart } from "#dashboard/components/charts/articles/source-distribution-chart";
import { DashboardOverviewCard } from "#dashboard/components/dashboard-overview-card";
import { PageLayout } from "#dashboard/components/shell/page-layout";

export const Route = createFileRoute("/_authenticated/dashboard")({
  component: DashboardPage,
  head: () => ({
    meta: [{ title: "Dashboard | Basango" }],
  }),
  loader: ({ context }) => {
    void context.queryClient.prefetchQuery(
      context.trpc.reports.getDashboardOverview.queryOptions(),
    );
    void context.queryClient.prefetchQuery(context.trpc.articles.getPublications.queryOptions({}));
    void context.queryClient.prefetchQuery(
      context.trpc.articles.getSourceDistribution.queryOptions({ limit: 8 }),
    );
  },
});

function DashboardPage() {
  return (
    <PageLayout title="Dashboard">
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
        <div className="flex flex-col gap-4 lg:col-span-3">
          <DashboardOverviewCard />
          <PublicationGraphChart />
        </div>
        <SourceDistributionChart />
      </div>
    </PageLayout>
  );
}
