import { createFileRoute } from "@tanstack/react-router";

import { requireAdminSession } from "#dashboard/app/auth/route-guards";
import { DashboardOverviewPage } from "#dashboard/features/dashboard/overview/pages/dashboard-overview-page";

export const Route = createFileRoute("/dashboard")({
  beforeLoad: ({ location }) => requireAdminSession(location.href),
  loader: ({ context }) => {
    void context.queryClient.prefetchQuery(
      context.trpc.reports.getDashboardOverview.queryOptions(),
    );
    void context.queryClient.prefetchQuery(context.trpc.articles.getPublications.queryOptions({}));
    void context.queryClient.prefetchQuery(
      context.trpc.articles.getSourceDistribution.queryOptions({ limit: 8 }),
    );
  },
  head: () => ({
    meta: [{ title: "Dashboard | Basango" }],
  }),
  component: DashboardOverviewPage,
});
