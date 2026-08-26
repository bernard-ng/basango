import { createFileRoute } from "@tanstack/react-router";

import { requireAdminSession } from "#dashboard/app/auth/route-guards";
import { ArticleDetailsPage } from "#dashboard/features/content/articles/pages/article-details-page";

export const Route = createFileRoute("/articles/$id")({
  beforeLoad: ({ location }) => requireAdminSession(location.href),
  loader: ({ context, params }) =>
    context.queryClient.ensureQueryData(
      context.trpc.articles.getById.queryOptions({ id: params.id }),
    ),
  head: () => ({
    meta: [{ title: "Article Details | Basango Dashboard" }],
  }),
  component: ArticleDetailsRoute,
});

function ArticleDetailsRoute() {
  const { id } = Route.useParams();

  return <ArticleDetailsPage articleId={id} />;
}
