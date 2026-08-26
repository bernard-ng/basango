import { createFileRoute } from "@tanstack/react-router";

import { requireAdminSession } from "#dashboard/app/auth/route-guards";
import { SourceDetailsPage } from "#dashboard/features/content/sources/pages/source-details-page";

export const Route = createFileRoute("/sources/$id")({
  beforeLoad: ({ location }) => requireAdminSession(location.href),
  loader: async ({ context, params }) => {
    const sourceQuery = context.trpc.sources.getById.queryOptions({ id: params.id });

    void context.queryClient.prefetchQuery(
      context.trpc.sources.getCategoryShares.queryOptions({ id: params.id, limit: 10 }),
    );
    void context.queryClient.prefetchQuery(
      context.trpc.sources.getPublications.queryOptions({ id: params.id }),
    );
    void context.queryClient.prefetchQuery(context.trpc.categories.list.queryOptions());
    void context.queryClient.prefetchInfiniteQuery(
      context.trpc.articles.list.infiniteQueryOptions(
        { limit: 12, sourceId: params.id },
        { getNextPageParam: (lastPage) => lastPage.meta.nextCursor, initialCursor: null },
      ),
    );

    return context.queryClient.ensureQueryData(sourceQuery);
  },
  head: () => ({
    meta: [{ title: "Source Details | Basango Dashboard" }],
  }),
  component: SourceDetailsRoute,
});

function SourceDetailsRoute() {
  const { id } = Route.useParams();

  return <SourceDetailsPage sourceId={id} />;
}
