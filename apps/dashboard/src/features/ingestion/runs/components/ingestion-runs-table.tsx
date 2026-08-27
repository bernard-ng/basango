"use client";

import { INGESTION_RUN_STATES, type IngestionRunState } from "@basango/domain/models";
import { Alert, AlertDescription, AlertTitle } from "@basango/ui/components/alert";
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

import { buildIngestionRunsQuery, resolveIngestionRunStates } from "../ingestion-runs-query";
import type { IngestionRun } from "../types";
import { createIngestionRunColumns } from "./ingestion-runs-columns";

const DEFAULT_TABLE_ID = "operations.recent-runs";

const stateLabels: Record<IngestionRunState, string> = {
  completed: "Completed",
  failed: "Failed",
  preparing: "Preparing",
  running: "Running",
};

type IngestionRunsTableProps = {
  realtime?: boolean;
  sourceId?: string;
  tableId?: string;
};

type RunStateFilterProps = {
  table: Table<IngestionRun>;
};

export function IngestionRunsTable({
  realtime = true,
  sourceId,
  tableId = DEFAULT_TABLE_ID,
}: IngestionRunsTableProps) {
  const trpc = useTRPC();
  const store = useTableStore(tableId, {
    pagination: { pageIndex: 0, pageSize: 10 },
    sorting: [{ desc: true, id: "lastSignalAt" }],
  });
  const queryInput = buildIngestionRunsQuery(store, sourceId);
  const transportOptions = realtime ? { trpc: { context: { realtime: true } } } : {};
  const listRuns = useQuery({
    ...trpc.operations.listIngestionRuns.queryOptions(queryInput, {
      refetchOnReconnect: false,
      refetchOnWindowFocus: false,
      retry: false,
      ...transportOptions,
    }),
    placeholderData: keepPreviousData,
  });
  const columns = useMemo<ColumnDef<IngestionRun>[]>(() => createIngestionRunColumns(), []);

  return (
    <>
      {listRuns.isError ? (
        <Alert className="mb-4" variant="destructive">
          <AlertTitle>Recent runs could not be loaded</AlertTitle>
          <AlertDescription className="flex items-center justify-between gap-3">
            <span>Check the API connection and try again.</span>
            <Button onClick={() => listRuns.refetch()} size="sm" type="button" variant="outline">
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      ) : null}
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
        tableId={tableId}
        toolbar={({ store: tableStore, table }) => (
          <DataTableToolbar
            filterPlaceholder={
              sourceId ? "Search agent or error…" : "Search source, agent, or error…"
            }
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
  const states = resolveIngestionRunStates(stateColumn?.getFilterValue());
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
