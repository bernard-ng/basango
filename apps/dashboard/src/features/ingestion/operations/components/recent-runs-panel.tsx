"use client";

import {
  INGESTION_RUN_SORT_FIELDS,
  INGESTION_RUN_STATES,
  type IngestionRunState,
  type IngestionRunsQuery,
} from "@basango/domain/models";
import { Alert, AlertDescription, AlertTitle } from "@basango/ui/components/alert";
import { Badge } from "@basango/ui/components/badge";
import { Button } from "@basango/ui/components/button";
import { DataTable, DataTableToolbar } from "@basango/ui/components/data-table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@basango/ui/components/select";
import { useTableStore } from "@basango/ui/stores/table-store";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import type { ColumnDef, Table } from "@tanstack/react-table";
import { useMemo } from "react";

import { useTRPC } from "#dashboard/app/trpc/client";

import { formatDuration, relativeTime, stateVariant } from "../ingestion-metrics";
import type { IngestionRun } from "../types";

const TABLE_ID = "operations.recent-runs";

const stateLabels: Record<IngestionRunState, string> = {
  completed: "Completed",
  failed: "Failed",
  preparing: "Preparing",
  running: "Running",
};

type RunStateFilterProps = {
  table: Table<IngestionRun>;
};

export function RecentRunsPanel() {
  const trpc = useTRPC();
  const store = useTableStore(TABLE_ID, {
    pagination: { pageIndex: 0, pageSize: 10 },
    sorting: [{ desc: true, id: "lastSignalAt" }],
  });
  const queryInput = buildRunsQuery(store);
  const listRuns = useQuery({
    ...trpc.operations.listIngestionRuns.queryOptions(queryInput, {
      refetchOnReconnect: false,
      refetchOnWindowFocus: false,
      retry: false,
      trpc: { context: { realtime: true } },
    }),
    placeholderData: keepPreviousData,
  });
  const columns = useMemo<ColumnDef<IngestionRun>[]>(() => createRunColumns(), []);

  return (
    <>
      {listRuns.isError && (
        <Alert className="mb-4" variant="destructive">
          <AlertTitle>Recent runs could not be loaded</AlertTitle>
          <AlertDescription className="flex items-center justify-between gap-3">
            <span>Check the API connection and try again.</span>
            <Button onClick={() => listRuns.refetch()} size="sm" type="button" variant="outline">
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      )}
      <DataTable
        columns={columns}
        data={listRuns.data?.items ?? []}
        emptyDescription="Runs will appear when an agent begins collecting."
        emptyTitle="No ingestion runs"
        getRowId={(run) => run.id}
        height="h-[34rem]"
        loading={listRuns.isPending}
        pageCount={listRuns.data?.pagination.pages ?? 1}
        rowCount={listRuns.data?.pagination.total}
        tableId={TABLE_ID}
        toolbar={({ store: tableStore, table }) => (
          <DataTableToolbar
            filterPlaceholder="Search source, agent, or error…"
            filters={(currentTable) => <RunStateFilter table={currentTable} />}
            store={tableStore}
            table={table}
          />
        )}
      />
    </>
  );
}

function RunStateFilter({ table }: RunStateFilterProps) {
  const stateColumn = table.getColumn("state");
  const states = resolveStates(stateColumn?.getFilterValue());
  const selectedState = states[0] ?? "all";

  return (
    <Select
      onValueChange={(value) => {
        stateColumn?.setFilterValue(value === "all" ? undefined : [value]);
      }}
      value={selectedState}
    >
      <SelectTrigger className="w-40" size="sm">
        <SelectValue placeholder="All statuses" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">All statuses</SelectItem>
        {INGESTION_RUN_STATES.map((state) => (
          <SelectItem key={state} value={state}>
            {stateLabels[state]}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function createRunColumns(): ColumnDef<IngestionRun>[] {
  return [
    {
      accessorKey: "sourceId",
      cell: ({ row }) => (
        <div className="grid max-w-64 gap-0.5">
          <span className="truncate font-medium">{row.original.sourceId}</span>
          {row.original.error && (
            <span className="truncate text-xs text-destructive" title={row.original.error}>
              {row.original.error}
            </span>
          )}
        </div>
      ),
      header: "Source",
    },
    {
      accessorKey: "state",
      cell: ({ row }) => (
        <Badge variant={stateVariant(row.original.state)}>{row.original.state}</Badge>
      ),
      header: "Status",
    },
    {
      accessorKey: "agentId",
      cell: ({ row }) => (
        <span className="block max-w-44 truncate text-muted-foreground">
          {row.original.agentId}
        </span>
      ),
      header: "Agent",
    },
    {
      accessorKey: "articlesDiscovered",
      cell: ({ row }) => <MetricValue value={row.original.articlesDiscovered} />,
      header: "Discovered",
    },
    {
      accessorKey: "articlesProcessed",
      cell: ({ row }) => <MetricValue value={row.original.articlesProcessed} />,
      header: "Processed",
    },
    {
      accessorKey: "articlesPersisted",
      cell: ({ row }) => <MetricValue value={row.original.articlesPersisted} />,
      header: "Persisted",
    },
    {
      accessorKey: "articlesSkipped",
      cell: ({ row }) => <MetricValue value={row.original.articlesSkipped} />,
      header: "Skipped",
    },
    {
      accessorKey: "articlesDelivered",
      cell: ({ row }) => <MetricValue value={row.original.articlesDelivered} />,
      header: "Delivered",
    },
    {
      accessorKey: "articlesFailed",
      cell: ({ row }) => <MetricValue value={row.original.articlesFailed} />,
      header: "Failed",
    },
    {
      accessorKey: "durationMs",
      cell: ({ row }) => (
        <span className="text-muted-foreground">{formatDuration(row.original.durationMs)}</span>
      ),
      header: "Duration",
    },
    {
      accessorKey: "lastSignalAt",
      cell: ({ row }) => (
        <time className="text-xs text-muted-foreground">
          {relativeTime(row.original.lastSignalAt)}
        </time>
      ),
      header: "Updated",
    },
  ];
}

function MetricValue({ value }: { value: number | null }) {
  return <span className="block text-right font-mono tabular-nums">{value ?? "—"}</span>;
}

function buildRunsQuery(store: ReturnType<typeof useTableStore>): IngestionRunsQuery {
  const query = store.globalFilter.trim();
  const states = resolveStates(store.columnFilters.find((filter) => filter.id === "state")?.value);
  const sorting = store.sorting[0];
  const filters = query || states.length > 0 ? { query: query || undefined, states } : undefined;
  const sort =
    sorting && isSortField(sorting.id)
      ? { direction: sorting.desc ? ("desc" as const) : ("asc" as const), field: sorting.id }
      : undefined;

  return {
    filters,
    page: {
      current: store.pagination.pageIndex + 1,
      limit: store.pagination.pageSize,
    },
    sort,
  };
}

function resolveStates(value: unknown): IngestionRunState[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter(isRunState);
}

function isRunState(value: unknown): value is IngestionRunState {
  return typeof value === "string" && INGESTION_RUN_STATES.includes(value as IngestionRunState);
}

function isSortField(value: string): value is (typeof INGESTION_RUN_SORT_FIELDS)[number] {
  return INGESTION_RUN_SORT_FIELDS.includes(value as (typeof INGESTION_RUN_SORT_FIELDS)[number]);
}
