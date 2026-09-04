"use client";

import { Button } from "@basango/ui/components/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@basango/ui/components/select";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { LoaderCircleIcon, XIcon } from "lucide-react";
import { useState } from "react";

import { useTRPC } from "#dashboard/app/trpc/client";

import { resolveArticleSearchDates } from "../article-search-params";
import type {
  ArticleSearchFilterState,
  ArticleSearchReferenceOption,
  ArticleSearchScope,
  ArticleSearchSort,
} from "../article-search-types";
import { ArticleSearchFilters } from "./article-search-filters";
import { ArticleSearchList } from "./article-search-list";

const SEARCH_PAGE_SIZE = 12;

export type ArticleSearchResultsProps = {
  categories: ArticleSearchReferenceOption[];
  filters: ArticleSearchFilterState;
  onCategoryChange: (categoryId?: string) => void;
  onClearFilters: () => void;
  onPublishedAfterChange: (publishedAfter?: string) => void;
  onPublishedBeforeChange: (publishedBefore?: string) => void;
  onSentimentChange: (sentiment?: ArticleSearchFilterState["sentiment"]) => void;
  onSortChange: (sort: ArticleSearchSort) => void;
  onSourceChange: (sourceId?: string) => void;
  query: string;
  scope: ArticleSearchScope;
  sort: ArticleSearchSort;
  sources: ArticleSearchReferenceOption[];
};

export function ArticleSearchResults({
  categories,
  filters,
  onCategoryChange,
  onClearFilters,
  onPublishedAfterChange,
  onPublishedBeforeChange,
  onSentimentChange,
  onSortChange,
  onSourceChange,
  query: searchQuery,
  scope,
  sort,
  sources,
}: ArticleSearchResultsProps) {
  const trpc = useTRPC();
  const [page, setPage] = useState(1);
  const dateRange = resolveArticleSearchDates({
    after: filters.publishedAfter,
    before: filters.publishedBefore,
  });
  const articles = useQuery({
    ...trpc.articles.search.queryOptions({
      categoryId: filters.categoryId,
      facets: ["sourceId", "categoryId", "sentiment"],
      limit: SEARCH_PAGE_SIZE,
      page,
      publishedAfter: dateRange.publishedAfter,
      publishedBefore: dateRange.publishedBefore,
      query: searchQuery,
      scope,
      sentiment: filters.sentiment,
      sort,
      sourceId: filters.sourceId,
    }),
    placeholderData: keepPreviousData,
  });
  const activeFilters = buildActiveFilters({
    categories,
    filters,
    onCategoryChange,
    onPublishedAfterChange,
    onPublishedBeforeChange,
    onSentimentChange,
    onSourceChange,
    sources,
  });

  return (
    <div className="grid items-start gap-6 lg:grid-cols-[15rem_minmax(0,1fr)] lg:gap-8">
      <ArticleSearchFilters
        categories={categories}
        facets={articles.data?.facets}
        filters={filters}
        onCategoryChange={onCategoryChange}
        onClear={onClearFilters}
        onPublishedAfterChange={onPublishedAfterChange}
        onPublishedBeforeChange={onPublishedBeforeChange}
        onSentimentChange={onSentimentChange}
        onSourceChange={onSourceChange}
        sources={sources}
      />

      <section className="min-w-0 space-y-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="truncate font-semibold text-lg">Results for “{searchQuery}”</h2>
              {articles.isFetching && !articles.isPending ? (
                <LoaderCircleIcon
                  aria-label="Updating results"
                  className="size-4 shrink-0 animate-spin text-muted-foreground"
                />
              ) : null}
            </div>
            <p className="text-muted-foreground text-sm">
              {articles.data
                ? formatResultCount(articles.data.meta.total)
                : "Searching the article archive…"}
            </p>
          </div>

          <Select onValueChange={(value) => onSortChange(toArticleSearchSort(value))} value={sort}>
            <SelectTrigger aria-label="Sort search results" className="w-full sm:w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="relevance">Most relevant</SelectItem>
              <SelectItem value="newest">Newest first</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {activeFilters.length > 0 ? (
          <div
            aria-label="Active search filters"
            className="flex flex-wrap items-center gap-2"
            role="group"
          >
            {activeFilters.map((filter) => (
              <Button
                className="rounded-full"
                key={filter.key}
                onClick={filter.remove}
                size="sm"
                type="button"
                variant="secondary"
              >
                {filter.label}
                <XIcon data-icon="inline-end" />
              </Button>
            ))}
            <Button
              className="rounded-full"
              onClick={onClearFilters}
              size="sm"
              type="button"
              variant="ghost"
            >
              Clear all
            </Button>
          </div>
        ) : null}

        <ArticleSearchList
          articles={articles.data?.items ?? []}
          emptyMessage="No articles match this search. Try a broader query or remove a filter."
          error={articles.error}
          isError={articles.isError}
          isFetching={articles.isFetching}
          isPending={articles.isPending}
          onPageChange={setPage}
          pagination={articles.data?.meta}
        />
      </section>
    </div>
  );
}

type ActiveFilter = {
  key: string;
  label: string;
  remove: () => void;
};

type BuildActiveFiltersOptions = Pick<
  ArticleSearchResultsProps,
  | "categories"
  | "filters"
  | "onCategoryChange"
  | "onPublishedAfterChange"
  | "onPublishedBeforeChange"
  | "onSentimentChange"
  | "onSourceChange"
  | "sources"
>;

function buildActiveFilters({
  categories,
  filters,
  onCategoryChange,
  onPublishedAfterChange,
  onPublishedBeforeChange,
  onSentimentChange,
  onSourceChange,
  sources,
}: BuildActiveFiltersOptions): ActiveFilter[] {
  const activeFilters: ActiveFilter[] = [];
  const category = categories.find((option) => option.id === filters.categoryId);
  const source = sources.find((option) => option.id === filters.sourceId);

  if (category) {
    activeFilters.push({ key: "category", label: category.name, remove: () => onCategoryChange() });
  }

  if (source) {
    activeFilters.push({ key: "source", label: source.name, remove: () => onSourceChange() });
  }

  if (filters.sentiment) {
    activeFilters.push({
      key: "sentiment",
      label: `${capitalize(filters.sentiment)} sentiment`,
      remove: () => onSentimentChange(),
    });
  }

  if (filters.publishedAfter) {
    activeFilters.push({
      key: "published-after",
      label: `From ${formatDateFilter(filters.publishedAfter)}`,
      remove: () => onPublishedAfterChange(),
    });
  }

  if (filters.publishedBefore) {
    activeFilters.push({
      key: "published-before",
      label: `Until ${formatDateFilter(filters.publishedBefore)}`,
      remove: () => onPublishedBeforeChange(),
    });
  }

  return activeFilters;
}

function formatDateFilter(value: string): string {
  return new Intl.DateTimeFormat("en", {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
    year: "numeric",
  }).format(new Date(`${value}T00:00:00.000Z`));
}

function formatResultCount(total: number): string {
  return `${total.toLocaleString()} ${total === 1 ? "article" : "articles"}`;
}

function capitalize(value: string): string {
  return `${value.charAt(0).toUpperCase()}${value.slice(1)}`;
}

function toArticleSearchSort(value: string | null): ArticleSearchSort {
  return value === "newest" ? "newest" : "relevance";
}
