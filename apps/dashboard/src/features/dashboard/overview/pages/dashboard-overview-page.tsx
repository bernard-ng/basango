import { PageLayout } from "#dashboard/app/components/page-layout";

import { DashboardOverviewCard } from "../components/dashboard-overview-card";
import { PublicationGraphChart } from "../components/publication-graph-chart";
import { SourceDistributionChart } from "../components/source-distribution-chart";

export function DashboardOverviewPage() {
  return (
    <PageLayout
      description="Monitor publishing activity, source coverage, and content performance."
      title="Dashboard"
    >
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
