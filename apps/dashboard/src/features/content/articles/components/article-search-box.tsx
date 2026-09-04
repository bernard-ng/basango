"use client";

import type { RouterOutputs } from "@basango/api/trpc/routers/_app";
import { Button } from "@basango/ui/components/button";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@basango/ui/components/input-group";
import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { ArrowRightIcon, LoaderCircleIcon, NewspaperIcon, SearchIcon, XIcon } from "lucide-react";
import { type FocusEvent, type FormEvent, useEffect, useState } from "react";

import { useTRPC } from "#dashboard/app/trpc/client";

import { ARTICLE_SEARCH_EXAMPLES } from "../article-search-examples";
import type { ArticleSearchScope } from "../article-search-types";

const AUTOCOMPLETE_DELAY_MS = 250;
const AUTOCOMPLETE_LIMIT = 5;

type SearchSuggestion = RouterOutputs["articles"]["search"]["items"][number];

type ArticleSearchBoxProps = {
  initialQuery: string;
  onScopeChange: (scope: ArticleSearchScope) => void;
  onSearch: (query: string) => void;
  scope: ArticleSearchScope;
};

export function ArticleSearchBox({
  initialQuery,
  onScopeChange,
  onSearch,
  scope,
}: ArticleSearchBoxProps) {
  const trpc = useTRPC();
  const [inputQuery, setInputQuery] = useState(initialQuery);
  const [isFocused, setIsFocused] = useState(false);
  const debouncedQuery = useDebouncedValue(inputQuery, AUTOCOMPLETE_DELAY_MS);
  const normalizedInput = inputQuery.trim();
  const suggestions = useQuery({
    ...trpc.articles.search.queryOptions({
      limit: AUTOCOMPLETE_LIMIT,
      page: 1,
      query: debouncedQuery.trim() || "_",
      scope: "title",
    }),
    enabled: isFocused && debouncedQuery.trim().length >= 2,
  });
  const showSuggestions = isFocused;

  function handleBlur(event: FocusEvent<HTMLFormElement>) {
    if (event.relatedTarget instanceof Node && event.currentTarget.contains(event.relatedTarget)) {
      return;
    }

    setIsFocused(false);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!normalizedInput) {
      return;
    }

    setIsFocused(false);
    onSearch(normalizedInput);
  }

  function runExample(query: string) {
    setInputQuery(query);
    setIsFocused(false);
    onSearch(query);
  }

  return (
    <form className="relative z-20" onBlur={handleBlur} onSubmit={handleSubmit}>
      <div
        className={
          showSuggestions
            ? "absolute inset-x-0 top-0 overflow-hidden rounded-xl border bg-popover shadow-xl"
            : "relative overflow-hidden rounded-xl border bg-background shadow-sm"
        }
      >
        <InputGroup className="h-14 rounded-none border-0 bg-transparent shadow-none ring-0 has-[[data-slot=input-group-control]:focus-visible]:ring-0">
          <InputGroupAddon align="inline-start" className="pl-4">
            {suggestions.isFetching ? (
              <LoaderCircleIcon className="size-5 animate-spin" />
            ) : (
              <SearchIcon className="size-5" />
            )}
          </InputGroupAddon>
          <InputGroupInput
            aria-label="Search the article archive"
            autoComplete="off"
            autoFocus
            className="h-full px-3 text-base md:text-lg"
            maxLength={512}
            onChange={(event) => setInputQuery(event.target.value)}
            onFocus={() => setIsFocused(true)}
            placeholder="Search titles and full article text…"
            type="search"
            value={inputQuery}
          />
          {inputQuery ? (
            <InputGroupAddon align="inline-end">
              <InputGroupButton
                aria-label="Clear search"
                onClick={() => setInputQuery("")}
                size="icon-sm"
              >
                <XIcon />
              </InputGroupButton>
            </InputGroupAddon>
          ) : null}
          <InputGroupAddon align="inline-end" className="pr-3">
            <Button disabled={!normalizedInput} size="lg" type="submit">
              Search
              <ArrowRightIcon data-icon="inline-end" />
            </Button>
          </InputGroupAddon>
        </InputGroup>

        <SearchScopeSelector onChange={onScopeChange} scope={scope} />

        {showSuggestions ? (
          <div className="border-t text-popover-foreground">
            <div className="space-y-1 p-2">
              {normalizedInput ? (
                <button
                  className="flex min-h-11 w-full items-center gap-3 rounded-lg px-3 text-left hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  onClick={() => runExample(normalizedInput)}
                  type="button"
                >
                  <SearchIcon className="size-4 shrink-0 text-primary" />
                  <span className="min-w-0 flex-1 truncate font-medium">
                    Search for “{normalizedInput}”
                  </span>
                  <ArrowRightIcon className="size-4 shrink-0 text-muted-foreground" />
                </button>
              ) : (
                <p className="px-3 pb-1 pt-2 font-medium text-muted-foreground text-xs uppercase tracking-wide">
                  Try a search
                </p>
              )}

              {normalizedInput.length >= 2
                ? suggestions.data?.items.map((article) => (
                    <SuggestionItem article={article} key={article.id} />
                  ))
                : ARTICLE_SEARCH_EXAMPLES.map((example) => (
                    <button
                      className="flex min-h-10 w-full items-center gap-3 rounded-lg px-3 text-left text-sm hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      key={example}
                      onClick={() => runExample(example)}
                      type="button"
                    >
                      <SearchIcon className="size-4 text-muted-foreground" />
                      {example}
                    </button>
                  ))}
            </div>
          </div>
        ) : null}
      </div>

      {showSuggestions ? <div aria-hidden="true" className="h-24" /> : null}
    </form>
  );
}

function SearchScopeSelector({
  onChange,
  scope,
}: {
  onChange: (scope: ArticleSearchScope) => void;
  scope: ArticleSearchScope;
}) {
  return (
    <div className="flex items-center gap-2 overflow-x-auto border-t px-3 py-2">
      <span className="mr-1 shrink-0 text-muted-foreground text-xs">Search in</span>
      <ScopeButton active={scope === "all"} label="All content" onClick={() => onChange("all")} />
      <ScopeButton
        active={scope === "title"}
        label="Titles only"
        onClick={() => onChange("title")}
      />
    </div>
  );
}

function ScopeButton({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <Button
      aria-pressed={active}
      className="rounded-full"
      onClick={onClick}
      size="xs"
      type="button"
      variant={active ? "secondary" : "ghost"}
    >
      {label}
    </Button>
  );
}

function SuggestionItem({ article }: { article: SearchSuggestion }) {
  return (
    <Link
      className="flex min-h-12 items-center gap-3 rounded-lg px-3 hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      params={{ id: article.id }}
      to="/articles/$id"
    >
      <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
        <NewspaperIcon className="size-4" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate font-medium text-sm">{article.title}</span>
        <span className="block truncate text-muted-foreground text-xs">
          {article.source.displayName ?? article.source.name}
        </span>
      </span>
    </Link>
  );
}

function useDebouncedValue(value: string, delay: number): string {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timeout = window.setTimeout(() => setDebouncedValue(value), delay);

    return () => window.clearTimeout(timeout);
  }, [delay, value]);

  return debouncedValue;
}
