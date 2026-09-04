"use client";

import { Button } from "@basango/ui/components/button";
import { Card, CardContent } from "@basango/ui/components/card";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@basango/ui/components/empty";
import { Field, FieldLabel } from "@basango/ui/components/field";
import { Input } from "@basango/ui/components/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@basango/ui/components/select";
import { useQuery } from "@tanstack/react-query";
import { SearchIcon, SlidersHorizontalIcon, XIcon } from "lucide-react";
import { parseAsString, parseAsStringLiteral, useQueryState, useQueryStates } from "nuqs";
import { type FormEvent, useState } from "react";

import { PageLayout } from "#dashboard/app/components/page-layout";
import { useTRPC } from "#dashboard/app/trpc/client";

import { ArticleSearchResults } from "../components/article-search-results";

const SENTIMENTS = ["negative", "neutral", "positive"] as const;

type ArticleSearchFormProps = {
  initialQuery: string;
  onSearch: (query: string) => void;
};

export function ArticleSearchPage() {
  const trpc = useTRPC();
  const [query, setQuery] = useQueryState("q", parseAsString);
  const [filters, setFilters] = useQueryStates({
    category: parseAsString,
    sentiment: parseAsStringLiteral(SENTIMENTS),
    source: parseAsString,
  });
  const categories = useQuery(trpc.categories.list.queryOptions());
  const sources = useQuery(trpc.sources.list.queryOptions({ limit: 100, page: 1 }));
  const normalizedQuery = query?.trim() ?? "";
  const hasFilters = Boolean(filters.category || filters.sentiment || filters.source);

  function handleSearch(nextQuery: string) {
    void setQuery(nextQuery || null);
  }

  function clearFilters() {
    void setFilters({ category: null, sentiment: null, source: null });
  }

  return (
    <PageLayout
      description="Search article titles and full text, then narrow results by publication, category, or sentiment."
      title="Search"
    >
      <Card>
        <CardContent className="space-y-4">
          <ArticleSearchForm
            initialQuery={normalizedQuery}
            key={normalizedQuery}
            onSearch={handleSearch}
          />

          <div className="grid gap-3 md:grid-cols-3">
            <Field>
              <FieldLabel htmlFor="search-source">Source</FieldLabel>
              <Select
                onValueChange={(value) =>
                  void setFilters({ source: value === "all" ? null : value })
                }
                value={filters.source ?? "all"}
              >
                <SelectTrigger className="w-full" id="search-source">
                  <SelectValue placeholder="All sources" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All sources</SelectItem>
                  {sources.data?.items.map((source) => (
                    <SelectItem key={source.id} value={source.id}>
                      {source.displayName ?? source.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            <Field>
              <FieldLabel htmlFor="search-category">Category</FieldLabel>
              <Select
                onValueChange={(value) =>
                  void setFilters({ category: value === "all" ? null : value })
                }
                value={filters.category ?? "all"}
              >
                <SelectTrigger className="w-full" id="search-category">
                  <SelectValue placeholder="All categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All categories</SelectItem>
                  {categories.data?.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            <Field>
              <FieldLabel htmlFor="search-sentiment">Sentiment</FieldLabel>
              <Select
                onValueChange={(value) =>
                  void setFilters({
                    sentiment:
                      value === "negative" || value === "neutral" || value === "positive"
                        ? value
                        : null,
                  })
                }
                value={filters.sentiment ?? "all"}
              >
                <SelectTrigger className="w-full" id="search-sentiment">
                  <SelectValue placeholder="All sentiments" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All sentiments</SelectItem>
                  <SelectItem value="positive">Positive</SelectItem>
                  <SelectItem value="neutral">Neutral</SelectItem>
                  <SelectItem value="negative">Negative</SelectItem>
                </SelectContent>
              </Select>
            </Field>
          </div>

          {hasFilters ? (
            <div className="flex justify-end">
              <Button onClick={clearFilters} size="sm" type="button" variant="ghost">
                <XIcon data-icon="inline-start" />
                Clear filters
              </Button>
            </div>
          ) : null}
        </CardContent>
      </Card>

      {normalizedQuery ? (
        <section className="space-y-4">
          <div>
            <h2 className="font-semibold text-lg">Results for “{normalizedQuery}”</h2>
            <p className="text-muted-foreground text-sm">
              Results are ranked by relevance, with newer articles used as a tie-breaker.
            </p>
          </div>
          <ArticleSearchResults
            categoryId={filters.category ?? undefined}
            key={`${normalizedQuery}:${filters.source ?? "all"}:${filters.category ?? "all"}:${filters.sentiment ?? "all"}`}
            query={normalizedQuery}
            sentiment={filters.sentiment ?? undefined}
            sourceId={filters.source ?? undefined}
          />
        </section>
      ) : (
        <Empty className="min-h-72 border">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <SlidersHorizontalIcon />
            </EmptyMedia>
            <EmptyTitle>Search the article archive</EmptyTitle>
            <EmptyDescription>
              Enter a phrase above to search titles and full article text. Filters are optional.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      )}
    </PageLayout>
  );
}

function ArticleSearchForm({ initialQuery, onSearch }: ArticleSearchFormProps) {
  const [query, setQuery] = useState(initialQuery);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSearch(query.trim());
  }

  return (
    <form className="flex flex-col gap-2 sm:flex-row" onSubmit={handleSubmit}>
      <div className="relative flex-1">
        <SearchIcon
          aria-hidden="true"
          className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
        />
        <Input
          aria-label="Search articles"
          autoComplete="off"
          autoFocus
          className="h-10 pl-9"
          maxLength={512}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search article titles and full text…"
          type="search"
          value={query}
        />
      </div>
      <Button className="h-10" disabled={!query.trim()} size="lg" type="submit">
        <SearchIcon data-icon="inline-start" />
        Search
      </Button>
    </form>
  );
}
