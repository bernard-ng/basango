"use client";

import type { RouterOutputs } from "@basango/api/trpc/routers/_app";
import { Alert, AlertDescription, AlertTitle } from "@basango/ui/components/alert";

import { OffsetPagination } from "#dashboard/features/content/shared/components/offset-pagination";

import { ArticleCard, ArticleCardSkeleton } from "./article-card";

type Article = RouterOutputs["articles"]["list"]["items"][number];

type ArticleGridProps = {
  articles: Article[];
  emptyMessage: string;
  error?: { message?: string } | null;
  isError: boolean;
  isFetching: boolean;
  isPending: boolean;
  onPageChange: (page: number) => void;
  pagination?: {
    current: number;
    pages: number;
    total: number;
  };
};

export function ArticleGrid({
  articles,
  emptyMessage,
  error,
  isError,
  isFetching,
  isPending,
  onPageChange,
  pagination,
}: ArticleGridProps) {
  return (
    <div className="space-y-4">
      {isError ? (
        <Alert variant="destructive">
          <AlertTitle>Unable to load articles</AlertTitle>
          <AlertDescription>
            {error?.message ?? "An unexpected error occurred while fetching articles."}
          </AlertDescription>
        </Alert>
      ) : null}

      {isPending ? (
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
        <div className="rounded-lg border border-dashed px-6 py-12 text-center text-muted-foreground text-sm">
          {emptyMessage}
        </div>
      )}

      {pagination ? (
        <OffsetPagination
          currentPage={pagination.current}
          isFetching={isFetching}
          itemLabel="article"
          onPageChange={onPageChange}
          pageCount={pagination.pages}
          total={pagination.total}
        />
      ) : null}
    </div>
  );
}
