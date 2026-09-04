"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useState } from "react";

import { useTRPC } from "#dashboard/app/trpc/client";

import { ArticleSearchList } from "./article-search-list";

const SEARCH_PAGE_SIZE = 12;

export type ArticleSearchResultsProps = {
  categoryId?: string;
  query: string;
  sentiment?: "negative" | "neutral" | "positive";
  sourceId?: string;
};

export function ArticleSearchResults({
  categoryId,
  query: searchQuery,
  sentiment,
  sourceId,
}: ArticleSearchResultsProps) {
  const trpc = useTRPC();
  const [page, setPage] = useState(1);
  const articles = useQuery({
    ...trpc.articles.search.queryOptions({
      categoryId,
      limit: SEARCH_PAGE_SIZE,
      page,
      query: searchQuery,
      sentiment,
      sourceId,
    }),
    placeholderData: keepPreviousData,
  });

  return (
    <ArticleSearchList
      articles={articles.data?.items ?? []}
      emptyMessage="No articles match this search."
      error={articles.error}
      isError={articles.isError}
      isFetching={articles.isFetching}
      isPending={articles.isPending}
      onPageChange={setPage}
      pagination={articles.data?.meta}
    />
  );
}
