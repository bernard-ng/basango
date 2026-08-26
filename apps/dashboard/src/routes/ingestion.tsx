import { createFileRoute } from "@tanstack/react-router";

import { requireAdminSession } from "#dashboard/app/auth/route-guards";
import { IngestionOperationsPage } from "#dashboard/features/ingestion/operations/pages/ingestion-operations-page";

export const Route = createFileRoute("/ingestion")({
  beforeLoad: ({ location }) => requireAdminSession(location.href),
  loader: ({ context }) => {
    void context.queryClient.prefetchQuery(
      context.trpc.operations.getIngestionAgents.queryOptions(),
    );
    void context.queryClient.prefetchQuery(
      context.trpc.operations.getIngestionSummary.queryOptions(),
    );
    void context.queryClient.prefetchQuery(
      context.trpc.operations.getIngestionThroughput.queryOptions(),
    );
    void context.queryClient.prefetchQuery(
      context.trpc.operations.listIngestionRuns.queryOptions({
        page: { current: 1, limit: 10 },
        sort: { direction: "desc", field: "lastSignalAt" },
      }),
    );
  },
  head: () => ({
    meta: [{ title: "Ingestion | Basango" }],
  }),
  component: IngestionOperationsPage,
});
