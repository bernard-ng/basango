import { createFileRoute } from "@tanstack/react-router";

import { requireAdminSession } from "#dashboard/app/auth/route-guards";
import { SourcesPage } from "#dashboard/features/content/sources/pages/sources-page";

export const Route = createFileRoute("/sources/")({
  beforeLoad: ({ location }) => requireAdminSession(location.href),
  component: SourcesPage,
  head: () => ({
    meta: [{ title: "Sources | Basango Dashboard" }],
  }),
  loader: ({ context }) =>
    context.queryClient.ensureQueryData(context.trpc.sources.list.queryOptions()),
  validateSearch: (search): { createSource?: boolean } =>
    search.createSource === true || search.createSource === "true" ? { createSource: true } : {},
});
