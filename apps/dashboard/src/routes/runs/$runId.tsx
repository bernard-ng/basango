import { createFileRoute } from "@tanstack/react-router";

import { requireAdminSession } from "#dashboard/app/auth/route-guards";
import { IngestionRunDetailsPage } from "#dashboard/features/ingestion/runs/pages/ingestion-run-details-page";

export const Route = createFileRoute("/runs/$runId")({
  beforeLoad: ({ location }) => requireAdminSession(location.href),
  loader: async ({ context, params }) => {
    const detailsQuery = context.trpc.operations.getIngestionRunDetails.queryOptions({
      runId: params.runId,
    });

    void context.queryClient.prefetchQuery(
      context.trpc.operations.listIngestionRunActivities.queryOptions({
        page: { current: 1, limit: 20 },
        runId: params.runId,
      }),
    );

    return context.queryClient.ensureQueryData(detailsQuery);
  },
  head: () => ({
    meta: [{ title: "Ingestion Run | Basango Dashboard" }],
  }),
  component: IngestionRunDetailsRoute,
});

function IngestionRunDetailsRoute() {
  const { runId } = Route.useParams();

  return <IngestionRunDetailsPage runId={runId} />;
}
