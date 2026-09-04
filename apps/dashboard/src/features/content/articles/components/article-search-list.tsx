"use client";

import type { RouterOutputs } from "@basango/api/trpc/routers/_app";
import { Alert, AlertDescription, AlertTitle } from "@basango/ui/components/alert";
import { Skeleton } from "@basango/ui/components/skeleton";
import { Link } from "@tanstack/react-router";
import { ExternalLinkIcon, NewspaperIcon } from "lucide-react";

import { formatDate } from "#dashboard/app/utils/formatters";
import { OffsetPagination } from "#dashboard/features/content/shared/components/offset-pagination";

type SearchArticle = RouterOutputs["articles"]["search"]["items"][number];

type HighlightedTextProps = {
  highlights: SearchArticle["highlights"]["title"];
};

type ArticleSearchListProps = {
  articles: SearchArticle[];
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

export function ArticleSearchList({
  articles,
  emptyMessage,
  error,
  isError,
  isFetching,
  isPending,
  onPageChange,
  pagination,
}: ArticleSearchListProps) {
  if (isError) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Unable to search articles</AlertTitle>
        <AlertDescription>
          {error?.message ?? "An unexpected error occurred while searching articles."}
        </AlertDescription>
      </Alert>
    );
  }

  if (isPending) {
    return <ArticleSearchListSkeleton />;
  }

  if (articles.length === 0) {
    return (
      <div className="max-w-3xl rounded-lg border border-dashed px-6 py-12 text-center text-muted-foreground text-sm">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="max-w-4xl space-y-5">
      {pagination ? (
        <p className="text-muted-foreground text-sm">
          {pagination.total.toLocaleString()} {pagination.total === 1 ? "result" : "results"}
        </p>
      ) : null}

      <div className="space-y-2">
        {articles.map((article) => (
          <article
            className="group -mx-3 rounded-xl px-3 py-4 transition-colors hover:bg-muted/40"
            key={article.id}
          >
            <div className="flex items-start gap-5">
              <div className="min-w-0 flex-1">
                <div className="mb-2.5 flex items-center gap-2.5">
                  <div className="flex size-8 shrink-0 items-center justify-center rounded-full border bg-background text-muted-foreground shadow-sm">
                    <NewspaperIcon className="size-3.5" />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate font-medium text-foreground text-sm">
                      {article.source.displayName ?? article.source.name}
                    </p>
                    <p className="truncate text-muted-foreground text-xs">
                      {formatResultUrl(article.link)}
                    </p>
                  </div>
                </div>

                <h2 className="text-[1.3rem] leading-snug tracking-tight">
                  <Link
                    className="font-medium text-blue-700 underline-offset-2 hover:underline dark:text-blue-400"
                    params={{ id: article.id }}
                    to="/articles/$id"
                  >
                    <HighlightedText highlights={article.highlights.title} />
                  </Link>
                </h2>

                <p className="mt-1.5 line-clamp-3 text-muted-foreground text-sm leading-6">
                  <span className="mr-1 font-medium text-foreground">
                    {formatDate(article.publishedAt.toISOString(), "MMM d, yyyy", false)} —
                  </span>
                  <HighlightedText highlights={article.highlights.excerpt} />
                </p>

                <div className="mt-2.5 flex flex-wrap items-center gap-2 text-muted-foreground text-xs">
                  {article.category ? (
                    <span className="rounded-full bg-muted px-2 py-1 text-foreground/80">
                      {article.category.name}
                    </span>
                  ) : null}
                  {article.readingTime ? <span>{article.readingTime} min read</span> : null}
                  <span aria-hidden="true" className="text-border">
                    •
                  </span>
                  <a
                    aria-label={`Open original article: ${article.title}`}
                    className="inline-flex items-center gap-1 font-medium hover:text-foreground hover:underline"
                    href={article.link}
                    rel="noreferrer"
                    target="_blank"
                  >
                    Original
                    <ExternalLinkIcon className="size-3" />
                  </a>
                </div>
              </div>

              {article.image ? (
                <Link
                  aria-label={`View ${article.title}`}
                  className="order-first shrink-0 overflow-hidden rounded-xl border bg-muted shadow-sm"
                  params={{ id: article.id }}
                  to="/articles/$id"
                >
                  <img
                    alt=""
                    className="h-20 w-24 object-cover transition-transform duration-200 group-hover:scale-[1.03] sm:h-24 sm:w-32"
                    loading="lazy"
                    src={article.image}
                  />
                </Link>
              ) : null}
            </div>
          </article>
        ))}
      </div>

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

function HighlightedText({ highlights }: HighlightedTextProps) {
  return highlights.map((highlight, index) =>
    highlight.highlighted ? (
      <mark
        className="rounded-sm bg-yellow-300 px-0.5 text-yellow-950 decoration-clone"
        key={`${highlight.text}:${index}`}
      >
        {cleanResultText(highlight.text)}
      </mark>
    ) : (
      <span key={`${highlight.text}:${index}`}>{cleanResultText(highlight.text)}</span>
    ),
  );
}

function ArticleSearchListSkeleton() {
  return (
    <div className="max-w-3xl space-y-8">
      {Array.from({ length: 5 }).map((_, index) => (
        <div className="space-y-3" key={index}>
          <div className="flex items-center gap-3">
            <Skeleton className="size-8 rounded-full" />
            <div className="space-y-1.5">
              <Skeleton className="h-3 w-32" />
              <Skeleton className="h-3 w-56" />
            </div>
          </div>
          <Skeleton className="h-6 w-4/5" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </div>
      ))}
    </div>
  );
}

function formatResultUrl(value: string): string {
  const url = new URL(value);
  const [section] = url.pathname.split("/").filter(Boolean);

  return section ? `${url.hostname} › ${shortenPath(section)}` : url.hostname;
}

function shortenPath(value: string): string {
  return value.length > 48 ? `${value.slice(0, 48)}…` : value;
}

function cleanResultText(value: string): string {
  return value.replaceAll("**", "").replaceAll("__", "");
}
