"use client";

import { Alert, AlertDescription, AlertTitle } from "@basango/ui/components/alert";
import { Button } from "@basango/ui/components/button";
import { useInfiniteQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import * as React from "react";

import { useTRPC } from "#dashboard/trpc/client";

import { ArticleCard, ArticleCardSkeleton } from "./article-card";

type ArticlesTableProps = {
  sourceId?: string;
};

const PLACEHOLDER_COUNT = 8;

export function ArticlesFeed({ sourceId }: ArticlesTableProps) {
  const trpc = useTRPC();

  const query = useInfiniteQuery(
    trpc.articles.list.infiniteQueryOptions(
      {
        limit: 12,
        sourceId,
      },
      {
        getNextPageParam: (lastPage) => (lastPage.meta.hasNext ? lastPage.meta.nextCursor : null),
        initialCursor: null,
      },
    ),
  );

  const articles = React.useMemo(
    () => query.data?.pages.flatMap((page) => page.items) ?? [],
    [query.data],
  );

  const isInitialLoading = query.isLoading && !query.data;

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

      {isInitialLoading ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: PLACEHOLDER_COUNT }).map((_, index) => (
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

      <div className="flex items-center justify-center">
        {query.hasNextPage ? (
          <Button
            disabled={query.isFetchingNextPage}
            onClick={() => query.fetchNextPage()}
            type="button"
            variant="outline"
          >
            {query.isFetchingNextPage ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Loading…
              </>
            ) : (
              "Load more"
            )}
          </Button>
        ) : articles.length > 0 ? (
          <p className="text-xs text-muted-foreground">You&apos;re all caught up.</p>
        ) : null}
      </div>
    </div>
  );
}
