"use client";

import type { RouterOutputs } from "@basango/api/trpc/routers/_app";
import { Button } from "@basango/ui/components/button";
import { Input } from "@basango/ui/components/input";
import { cn } from "@basango/ui/lib/utils";
import { CheckIcon, SlidersHorizontalIcon, XIcon } from "lucide-react";
import type { ReactNode } from "react";

import type {
  ArticleSearchFilterState,
  ArticleSearchReferenceOption,
} from "../article-search-types";

type ArticleSearchFacets = RouterOutputs["articles"]["search"]["facets"];

type ArticleSearchFiltersProps = {
  categories: ArticleSearchReferenceOption[];
  facets?: ArticleSearchFacets;
  filters: ArticleSearchFilterState;
  onCategoryChange: (categoryId?: string) => void;
  onClear: () => void;
  onPublishedAfterChange: (publishedAfter?: string) => void;
  onPublishedBeforeChange: (publishedBefore?: string) => void;
  onSentimentChange: (sentiment?: ArticleSearchFilterState["sentiment"]) => void;
  onSourceChange: (sourceId?: string) => void;
  sources: ArticleSearchReferenceOption[];
};

const sentimentOptions = [
  { id: "positive", name: "Positive" },
  { id: "neutral", name: "Neutral" },
  { id: "negative", name: "Negative" },
] as const;

export function ArticleSearchFilters({
  categories,
  facets,
  filters,
  onCategoryChange,
  onClear,
  onPublishedAfterChange,
  onPublishedBeforeChange,
  onSentimentChange,
  onSourceChange,
  sources,
}: ArticleSearchFiltersProps) {
  const activeFilterCount = [
    filters.categoryId,
    filters.publishedAfter,
    filters.publishedBefore,
    filters.sentiment,
    filters.sourceId,
  ].filter(Boolean).length;

  return (
    <aside aria-label="Refine search results" className="self-start rounded-xl border bg-card">
      <div className="flex items-center justify-between gap-3 border-b px-4 py-3">
        <div className="flex items-center gap-2">
          <SlidersHorizontalIcon className="size-4 text-muted-foreground" />
          <h2 className="font-semibold text-sm">Refine results</h2>
          {activeFilterCount > 0 ? (
            <span className="rounded-full bg-primary px-1.5 py-0.5 font-medium text-[0.65rem] text-primary-foreground">
              {activeFilterCount}
            </span>
          ) : null}
        </div>
        {activeFilterCount > 0 ? (
          <Button onClick={onClear} size="xs" type="button" variant="ghost">
            Clear
          </Button>
        ) : null}
      </div>

      <div className="divide-y">
        <FilterSection title="Publication date">
          <div className="grid grid-cols-2 gap-2 lg:grid-cols-1">
            <label
              className="grid gap-1 text-muted-foreground text-xs"
              htmlFor="search-published-after"
            >
              From
              <Input
                aria-label="Published after"
                className="w-full"
                id="search-published-after"
                max={filters.publishedBefore}
                onChange={(event) => onPublishedAfterChange(event.target.value || undefined)}
                type="date"
                value={filters.publishedAfter ?? ""}
              />
            </label>
            <label
              className="grid gap-1 text-muted-foreground text-xs"
              htmlFor="search-published-before"
            >
              To
              <Input
                aria-label="Published before"
                className="w-full"
                id="search-published-before"
                min={filters.publishedAfter}
                onChange={(event) => onPublishedBeforeChange(event.target.value || undefined)}
                type="date"
                value={filters.publishedBefore ?? ""}
              />
            </label>
          </div>
        </FilterSection>

        <FilterSection title="Sentiment">
          <div className="space-y-1">
            {sentimentOptions.map((option) => (
              <FilterOption
                active={filters.sentiment === option.id}
                count={facets?.sentiment?.[option.id]}
                key={option.id}
                label={option.name}
                onClick={() =>
                  onSentimentChange(filters.sentiment === option.id ? undefined : option.id)
                }
              />
            ))}
          </div>
        </FilterSection>

        <FilterSection title="Category">
          <FilterOptionList
            activeId={filters.categoryId}
            counts={facets?.categoryId}
            onChange={onCategoryChange}
            options={categories}
          />
        </FilterSection>

        <FilterSection title="Source">
          <FilterOptionList
            activeId={filters.sourceId}
            counts={facets?.sourceId}
            onChange={onSourceChange}
            options={sources}
          />
        </FilterSection>
      </div>
    </aside>
  );
}

function FilterSection({ children, title }: { children: ReactNode; title: string }) {
  return (
    <section className="space-y-3 p-4">
      <h3 className="font-medium text-muted-foreground text-xs uppercase tracking-wide">{title}</h3>
      {children}
    </section>
  );
}

function FilterOptionList({
  activeId,
  counts,
  onChange,
  options,
}: {
  activeId?: string;
  counts?: Record<string, number>;
  onChange: (id?: string) => void;
  options: ArticleSearchReferenceOption[];
}) {
  const orderedOptions = [...options].sort((left, right) => {
    if (left.id === activeId) {
      return -1;
    }

    if (right.id === activeId) {
      return 1;
    }

    return (
      (counts?.[right.id] ?? 0) - (counts?.[left.id] ?? 0) || left.name.localeCompare(right.name)
    );
  });

  if (orderedOptions.length === 0) {
    return <p className="text-muted-foreground text-xs">No options available.</p>;
  }

  return (
    <div className="max-h-48 space-y-1 overflow-y-auto pr-1">
      {orderedOptions.map((option) => (
        <FilterOption
          active={activeId === option.id}
          count={counts?.[option.id]}
          key={option.id}
          label={option.name}
          onClick={() => onChange(activeId === option.id ? undefined : option.id)}
        />
      ))}
    </div>
  );
}

function FilterOption({
  active,
  count,
  label,
  onClick,
}: {
  active: boolean;
  count?: number;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      aria-pressed={active}
      className={cn(
        "flex min-h-8 w-full items-center gap-2 rounded-md px-2 text-left text-sm transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        active && "bg-muted font-medium text-foreground",
      )}
      onClick={onClick}
      type="button"
    >
      <span
        className={cn(
          "flex size-4 shrink-0 items-center justify-center rounded border",
          active && "border-primary bg-primary text-primary-foreground",
        )}
      >
        {active ? <CheckIcon className="size-3" /> : null}
      </span>
      <span className="min-w-0 flex-1 truncate">{label}</span>
      {count !== undefined ? (
        <span className="shrink-0 text-muted-foreground text-xs">{count.toLocaleString()}</span>
      ) : null}
      {active ? <XIcon className="size-3.5 shrink-0 text-muted-foreground" /> : null}
    </button>
  );
}
