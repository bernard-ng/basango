"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useState } from "react";

import { useTRPC } from "#dashboard/app/trpc/client";

import { useCategoryFilterParams } from "../hooks/use-category-filter-params";
import { ArticleGrid } from "./article-grid";

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

  return (
    <ArticleGrid
      articles={query.data?.items ?? []}
      emptyMessage="No articles match your filters yet."
      error={query.error}
      isError={query.isError}
      isFetching={query.isFetching}
      isPending={query.isPending}
      onPageChange={setPage}
      pagination={query.data?.meta}
    />
  );
}
