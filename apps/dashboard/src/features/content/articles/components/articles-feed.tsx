"use client";

import { Alert, AlertDescription, AlertTitle } from "@basango/ui/components/alert";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useState } from "react";

import { useTRPC } from "#dashboard/app/trpc/client";
import { OffsetPagination } from "#dashboard/features/content/shared/components/offset-pagination";

import { useCategoryFilterParams } from "../hooks/use-category-filter-params";
import { ArticleCard, ArticleCardSkeleton } from "./article-card";

const ARTICLE_PAGE_SIZE = 12;

type ArticlesFeedProps = {
  sourceId?: string;
};

type PaginatedArticlesFeedProps = {
  category?: string;
  sourceId?: string;
};

export function ArticlesFeed({ sourceId }: ArticlesFeedProps) {
  const { selectedCategory } = useCategoryFilterParams();

  return (
    <PaginatedArticlesFeed
      category={selectedCategory ?? undefined}
      key={`${sourceId ?? "all"}:${selectedCategory ?? "all"}`}
      sourceId={sourceId}
    />
  );
}

function PaginatedArticlesFeed({ category, sourceId }: PaginatedArticlesFeedProps) {
  const trpc = useTRPC();
  const [page, setPage] = useState(1);
  const query = useQuery({
    ...trpc.articles.list.queryOptions({
      category,
      limit: ARTICLE_PAGE_SIZE,
      page,
      sourceId,
    }),
    placeholderData: keepPreviousData,
  });
  const articles = query.data?.items ?? [];
  const pagination = query.data?.meta;

  return (
    <div className="space-y-4">
      {query.isError && (
        <Alert variant="destructive">
          <AlertTitle>Unable to load articles</AlertTitle>
          <AlertDescription>
            {query.error.message ?? "An unexpected error occurred while fetching articles."}
          </AlertDescription>
        </Alert>
      )}

      {query.isPending ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, index) => (
            <ArticleCardSkeleton key={index} />
          ))}
        </div>
      ) : articles.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {articles.map((article) => (
            <ArticleCard article={article} key={article.id} />
          ))}
        </div>
      ) : (
        <div className="rounded-lg border border-dashed px-6 py-12 text-center text-sm text-muted-foreground">
          No articles match your filters yet.
        </div>
      )}

      {pagination ? (
        <OffsetPagination
          currentPage={pagination.current}
          isFetching={query.isFetching}
          itemLabel="article"
          onPageChange={setPage}
          pageCount={pagination.pages}
          total={pagination.total}
        />
      ) : null}
    </div>
  );
}
