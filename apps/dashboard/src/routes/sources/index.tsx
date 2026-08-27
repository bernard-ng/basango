import { createFileRoute } from "@tanstack/react-router";

import { requireAdminSession } from "#dashboard/app/auth/route-guards";
import { SourcesPage } from "#dashboard/features/content/sources/pages/sources-page";

export const Route = createFileRoute("/sources/")({
  validateSearch: (search): { createSource?: boolean } =>
    search.createSource === true || search.createSource === "true" ? { createSource: true } : {},
  beforeLoad: ({ location }) => requireAdminSession(location.href),
  loader: ({ context }) =>
    context.queryClient.ensureQueryData(
      context.trpc.sources.list.queryOptions({ limit: 6, page: 1 }),
    ),
  head: () => ({
    meta: [{ title: "Sources | Basango Dashboard" }],
  }),
  component: SourcesPage,
});
