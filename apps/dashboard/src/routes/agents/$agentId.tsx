import { createFileRoute } from "@tanstack/react-router";

import { requireAdminSession } from "#dashboard/app/auth/route-guards";
import { IngestionAgentDetailsPage } from "#dashboard/features/ingestion/agents/pages/ingestion-agent-details-page";

export const Route = createFileRoute("/agents/$agentId")({
  beforeLoad: ({ location }) => requireAdminSession(location.href),
  loader: async ({ context, params }) => {
    const detailsQuery = context.trpc.operations.getIngestionAgentDetails.queryOptions({
      agentId: params.agentId,
    });

    void context.queryClient.prefetchQuery(
      context.trpc.operations.listIngestionAgentActivities.queryOptions({
        agentId: params.agentId,
        page: { current: 1, limit: 20 },
      }),
    );
    void context.queryClient.prefetchQuery(
      context.trpc.operations.listIngestionRuns.queryOptions({
        filters: { agentId: params.agentId },
        page: { current: 1, limit: 10 },
        sort: { direction: "desc", field: "lastSignalAt" },
      }),
    );

    return context.queryClient.ensureQueryData(detailsQuery);
  },
  head: () => ({
    meta: [{ title: "Ingestion Agent | Basango Dashboard" }],
  }),
  component: IngestionAgentDetailsRoute,
});

function IngestionAgentDetailsRoute() {
  const { agentId } = Route.useParams();

  return <IngestionAgentDetailsPage agentId={agentId} />;
}
