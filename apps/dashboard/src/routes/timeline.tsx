import { createFileRoute } from "@tanstack/react-router";

import { requireAdminSession } from "#dashboard/app/auth/route-guards";
import { CrawlHistoryPage } from "#dashboard/features/ingestion/history/pages/crawl-history-page";

export const Route = createFileRoute("/timeline")({
  beforeLoad: ({ location }) => requireAdminSession(location.href),
  loader: ({ context }) => {
    void context.queryClient.prefetchQuery(
      context.trpc.operations.listIngestionRuns.queryOptions({
        page: { current: 1, limit: 50 },
        sort: { direction: "desc", field: "lastSignalAt" },
      }),
    );
  },
  head: () => ({
    meta: [{ title: "Timeline | Basango" }],
  }),
  component: CrawlHistoryPage,
});
