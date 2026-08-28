"use client";

import { Alert, AlertDescription, AlertTitle } from "@basango/ui/components/alert";
import { Button } from "@basango/ui/components/button";
import { DataTable } from "@basango/ui/components/data-table";
import { useTableStore } from "@basango/ui/stores/table-store";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";
import { useMemo } from "react";

import { useTRPC } from "#dashboard/app/trpc/client";

import type { IngestionRunActivity } from "../types";
import { createIngestionRunActivityColumns } from "./ingestion-run-activity-columns";

type IngestionRunActivityTableProps = {
  isLive: boolean;
  runId: string;
};

export function IngestionRunActivityTable({ isLive, runId }: IngestionRunActivityTableProps) {
  const trpc = useTRPC();
  const tableId = `operations.run-activity.${runId}`;
  const store = useTableStore(tableId, {
    pagination: { pageIndex: 0, pageSize: 20 },
  });
  const listActivities = useQuery({
    ...trpc.operations.listIngestionRunActivities.queryOptions({
      page: {
        current: store.pagination.pageIndex + 1,
        limit: store.pagination.pageSize,
      },
      runId,
    }),
    placeholderData: keepPreviousData,
    refetchInterval: isLive ? 3_000 : false,
  });
  const columns = useMemo<ColumnDef<IngestionRunActivity>[]>(
    () => createIngestionRunActivityColumns(),
    [],
  );

  return (
    <div className="space-y-4">
      {listActivities.isError ? (
        <Alert variant="destructive">
          <AlertTitle>Activity events could not be loaded</AlertTitle>
          <AlertDescription className="flex items-center justify-between gap-3">
            <span>Check the API connection and try again.</span>
            <Button
              onClick={() => listActivities.refetch()}
              size="sm"
              type="button"
              variant="outline"
            >
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      ) : null}
      <DataTable
        columns={columns}
        data={listActivities.data?.items ?? []}
        emptyDescription="Signals from this run will appear here as the crawler reports progress."
        emptyTitle="No activity events"
        getRowId={(activity) => activity.id}
        height="h-[32rem]"
        loading={listActivities.isPending}
        pageCount={listActivities.data?.pagination.pages ?? 1}
        rowCount={listActivities.data?.pagination.total}
        tableId={tableId}
      />
    </div>
  );
}
