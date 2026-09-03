"use client";

import {
  INGESTION_RUN_STATES,
  type IngestionRunState,
  type IngestionRunsQuery,
} from "@basango/domain/models";
import { Alert, AlertDescription, AlertTitle } from "@basango/ui/components/alert";
import { Button } from "@basango/ui/components/button";
import { Skeleton } from "@basango/ui/components/skeleton";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { ChevronLeftIcon, ChevronRightIcon, RefreshCwIcon, TimerIcon } from "lucide-react";
import { useMemo, useState } from "react";

import { PageLayout } from "#dashboard/app/components/page-layout";
import { useTRPC } from "#dashboard/app/trpc/client";

import { CrawlHistoryTimeline } from "../components/crawl-history-timeline";
import { CrawlHistoryLegend, CrawlHistoryToolbar } from "../components/crawl-history-toolbar";
import { CRAWL_HISTORY_PAGE_SIZE, type CrawlHistorySort } from "../crawl-history-model";

export function CrawlHistoryPage() {
  const trpc = useTRPC();
  const [page, setPage] = useState(1);
  const [state, setState] = useState<IngestionRunState | "all">("all");
  const [sort, setSort] = useState<CrawlHistorySort>("latest");
  const queryInput = useMemo(() => buildHistoryQuery({ page, sort, state }), [page, sort, state]);
  const history = useQuery({
    ...trpc.operations.listIngestionRuns.queryOptions(queryInput, {
      refetchOnReconnect: false,
      refetchOnWindowFocus: false,
      retry: false,
    }),
    placeholderData: keepPreviousData,
  });
  const runs = history.data?.items ?? [];
  const pagination = history.data?.pagination;

  function handleState(value: string | null) {
    setPage(1);
    setState(isRunState(value) ? value : "all");
  }

  function handleSort(value: string | null) {
    setPage(1);
    setSort(isHistorySort(value) ? value : "latest");
  }

  return (
    <PageLayout
      actions={
        <Button
          disabled={history.isFetching}
          onClick={() => history.refetch()}
          size="sm"
          variant="outline"
        >
          <RefreshCwIcon className={history.isFetching ? "animate-spin" : undefined} />
          Refresh
        </Button>
      }
      className="h-[calc(100dvh-6rem)] min-h-144 overflow-hidden"
      description="Compare crawl duration and article workload across sources, then inspect when every job ran."
      title="Timeline"
    >
      {history.isError ? (
        <Alert variant="destructive">
          <AlertTitle>Timeline could not be loaded</AlertTitle>
          <AlertDescription className="flex items-center justify-between gap-3">
            <span>Check the API connection and try again.</span>
            <Button onClick={() => history.refetch()} size="sm" type="button" variant="outline">
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      ) : null}

      <section className="flex min-h-0 flex-1 flex-col gap-3">
        <div className="flex shrink-0 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <CrawlHistoryLegend />
          <CrawlHistoryToolbar
            onSortChange={handleSort}
            onStateChange={handleState}
            sort={sort}
            state={state}
          />
        </div>
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg border">
          {history.isPending ? (
            <TimelineSkeleton />
          ) : runs.length > 0 ? (
            <div className="min-h-0 flex-1">
              <CrawlHistoryTimeline runs={runs} />
            </div>
          ) : (
            <div className="flex min-h-0 flex-1 flex-col items-center justify-center px-6 text-center">
              <TimerIcon className="mb-3 size-8 text-muted-foreground/60" />
              <p className="font-medium">No crawl jobs found</p>
              <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                Try another filter, or wait until an agent begins collecting from a source.
              </p>
            </div>
          )}
          <div className="flex shrink-0 items-center justify-between gap-4 border-t px-4 py-3 text-xs text-muted-foreground">
            <span>
              {pagination
                ? `${pagination.total.toLocaleString()} total jobs · page ${pagination.current} of ${pagination.pages}`
                : "Loading job count…"}
            </span>
            <div className="flex items-center gap-1">
              <Button
                aria-label="Previous page"
                disabled={!pagination || pagination.current <= 1 || history.isFetching}
                onClick={() => setPage((current) => Math.max(1, current - 1))}
                size="icon-sm"
                variant="outline"
              >
                <ChevronLeftIcon />
              </Button>
              <Button
                aria-label="Next page"
                disabled={
                  !pagination || pagination.current >= pagination.pages || history.isFetching
                }
                onClick={() => setPage((current) => current + 1)}
                size="icon-sm"
                variant="outline"
              >
                <ChevronRightIcon />
              </Button>
            </div>
          </div>
        </div>
      </section>
    </PageLayout>
  );
}

function TimelineSkeleton() {
  return (
    <div className="grid h-full gap-3 p-4">
      <Skeleton className="h-10 w-full" />
      {Array.from({ length: 7 }, (_, index) => (
        <div className="flex h-12 items-center gap-4" key={index}>
          <Skeleton className="h-6 w-64" />
          <Skeleton className="h-8 flex-1" />
        </div>
      ))}
    </div>
  );
}

function buildHistoryQuery({
  page,
  sort,
  state,
}: {
  page: number;
  sort: CrawlHistorySort;
  state: IngestionRunState | "all";
}): IngestionRunsQuery {
  const states = state === "all" ? undefined : [state];
  const filters = states ? { states } : undefined;
  const sortFields = {
    latest: "lastSignalAt",
    slowest: "durationMs",
    work: "articlesDiscovered",
  } as const;

  return {
    filters,
    page: { current: page, limit: CRAWL_HISTORY_PAGE_SIZE },
    sort: { direction: "desc", field: sortFields[sort] },
  };
}

function isRunState(value: string | null): value is IngestionRunState {
  return value !== null && INGESTION_RUN_STATES.includes(value as IngestionRunState);
}

function isHistorySort(value: string | null): value is CrawlHistorySort {
  return value === "latest" || value === "slowest" || value === "work";
}
