import { useSuspenseQuery } from "@tanstack/react-query";

import { PageLayout } from "#dashboard/app/components/page-layout";
import { useTRPC } from "#dashboard/app/trpc/client";

import { ArticleDetails } from "../components/article-details";

type ArticleDetailsPageProps = {
  articleId: string;
};

export function ArticleDetailsPage({ articleId }: ArticleDetailsPageProps) {
  const trpc = useTRPC();
  const { data: article } = useSuspenseQuery(trpc.articles.getById.queryOptions({ id: articleId }));

  return (
    <PageLayout>
      <ArticleDetails article={article} />
    </PageLayout>
  );
}
