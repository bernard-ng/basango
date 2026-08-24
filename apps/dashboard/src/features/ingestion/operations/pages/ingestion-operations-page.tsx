import { PageLayout } from "#dashboard/app/components/page-layout";

import { LiveBadge } from "../components/dashboard-primitives";
import { IngestionOperations } from "../components/ingestion-operations";
import { useIngestionOverview } from "../hooks/use-ingestion-overview";

export function IngestionOperationsPage() {
  const ingestion = useIngestionOverview();

  return (
    <PageLayout
      description="Track crawler agents, pipeline health, and recent ingestion runs in real time."
      title={
        <span className="flex items-center gap-2">
          Ingestion monitor
          <LiveBadge connected={ingestion.streamConnected} />
        </span>
      }
    >
      <IngestionOperations data={ingestion.data} isPending={ingestion.isPending} />
    </PageLayout>
  );
}
