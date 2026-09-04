"use client";

import { Button } from "@basango/ui/components/button";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@basango/ui/components/empty";
import { useQuery } from "@tanstack/react-query";
import { SearchIcon } from "lucide-react";
import { parseAsString, parseAsStringLiteral, useQueryStates } from "nuqs";

import { PageLayout } from "#dashboard/app/components/page-layout";
import { useTRPC } from "#dashboard/app/trpc/client";

import { ARTICLE_SEARCH_EXAMPLES } from "../article-search-examples";
import type {
  ArticleSearchFilterState,
  ArticleSearchScope,
  ArticleSearchSort,
} from "../article-search-types";
import { ArticleSearchBox } from "../components/article-search-box";
import { ArticleSearchResults } from "../components/article-search-results";

const SENTIMENTS = ["negative", "neutral", "positive"] as const;
const SEARCH_SCOPES = ["all", "title"] as const;
const SEARCH_SORTS = ["relevance", "newest"] as const;

export function ArticleSearchPage() {
  const trpc = useTRPC();
  const [search, setSearch] = useQueryStates({
    after: parseAsString,
    before: parseAsString,
    category: parseAsString,
    q: parseAsString,
    scope: parseAsStringLiteral(SEARCH_SCOPES),
    sentiment: parseAsStringLiteral(SENTIMENTS),
    sort: parseAsStringLiteral(SEARCH_SORTS),
    source: parseAsString,
  });
  const categories = useQuery(trpc.categories.list.queryOptions());
  const sources = useQuery(trpc.sources.list.queryOptions({ limit: 100, page: 1 }));
  const normalizedQuery = search.q?.trim() ?? "";
  const scope: ArticleSearchScope = search.scope ?? "all";
  const sort: ArticleSearchSort = search.sort ?? "relevance";
  const filters: ArticleSearchFilterState = {
    categoryId: search.category ?? undefined,
    publishedAfter: search.after ?? undefined,
    publishedBefore: search.before ?? undefined,
    sentiment: search.sentiment ?? undefined,
    sourceId: search.source ?? undefined,
  };
  const categoryOptions =
    categories.data?.map((category) => ({ id: category.id, name: category.name })) ?? [];
  const sourceOptions =
    sources.data?.items.map((source) => ({
      id: source.id,
      name: source.displayName ?? source.name,
    })) ?? [];

  function handleSearch(query: string) {
    void setSearch({ q: query || null });
  }

  function handleScopeChange(nextScope: ArticleSearchScope) {
    void setSearch({ scope: nextScope === "all" ? null : nextScope });
  }

  function handleSortChange(nextSort: ArticleSearchSort) {
    void setSearch({ sort: nextSort === "relevance" ? null : nextSort });
  }

  function clearFilters() {
    void setSearch({
      after: null,
      before: null,
      category: null,
      sentiment: null,
      source: null,
    });
  }

  return (
    <PageLayout
      className="gap-8"
      description="Find reporting across the archive, then narrow it by source, category, sentiment, or publication date."
      title="Search articles"
    >
      <ArticleSearchBox
        initialQuery={normalizedQuery}
        key={normalizedQuery}
        onScopeChange={handleScopeChange}
        onSearch={handleSearch}
        scope={scope}
      />

      {normalizedQuery ? (
        <ArticleSearchResults
          categories={categoryOptions}
          filters={filters}
          key={`${normalizedQuery}:${scope}:${sort}:${search.source ?? "all"}:${search.category ?? "all"}:${search.sentiment ?? "all"}:${search.after ?? "start"}:${search.before ?? "end"}`}
          onCategoryChange={(categoryId) => void setSearch({ category: categoryId ?? null })}
          onClearFilters={clearFilters}
          onPublishedAfterChange={(publishedAfter) =>
            void setSearch({ after: publishedAfter ?? null })
          }
          onPublishedBeforeChange={(publishedBefore) =>
            void setSearch({ before: publishedBefore ?? null })
          }
          onSentimentChange={(sentiment) => void setSearch({ sentiment: sentiment ?? null })}
          onSortChange={handleSortChange}
          onSourceChange={(sourceId) => void setSearch({ source: sourceId ?? null })}
          query={normalizedQuery}
          scope={scope}
          sort={sort}
          sources={sourceOptions}
        />
      ) : (
        <EmptySearchState onSearch={handleSearch} />
      )}
    </PageLayout>
  );
}

function EmptySearchState({ onSearch }: { onSearch: (query: string) => void }) {
  return (
    <Empty className="min-h-80 border bg-muted/20">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <SearchIcon />
        </EmptyMedia>
        <EmptyTitle>Explore the article archive</EmptyTitle>
        <EmptyDescription>
          Search headlines and full text. Use quotes for an exact phrase or OR to compare topics.
        </EmptyDescription>
      </EmptyHeader>
      <div className="flex max-w-2xl flex-wrap justify-center gap-2">
        {ARTICLE_SEARCH_EXAMPLES.map((example) => (
          <Button key={example} onClick={() => onSearch(example)} type="button" variant="outline">
            {example}
          </Button>
        ))}
      </div>
    </Empty>
  );
}
