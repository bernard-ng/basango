"use client";

import { Alert, AlertDescription, AlertTitle } from "@basango/ui/components/alert";
import { Button } from "@basango/ui/components/button";
import { DataTable } from "@basango/ui/components/data-table";
import { useTableStore } from "@basango/ui/stores/table-store";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";
import { useMemo } from "react";

import { useTRPC } from "#dashboard/app/trpc/client";

import type { IngestionAgentActivity } from "../types";
import { createIngestionAgentActivityColumns } from "./ingestion-agent-activity-columns";

type IngestionAgentActivityTableProps = {
  agentId: string;
};

export function IngestionAgentActivityTable({ agentId }: IngestionAgentActivityTableProps) {
  const trpc = useTRPC();
  const tableId = `operations.agent-activity.${agentId}`;
  const store = useTableStore(tableId, {
    pagination: { pageIndex: 0, pageSize: 20 },
  });
  const listActivities = useQuery({
    ...trpc.operations.listIngestionAgentActivities.queryOptions({
      agentId,
      page: {
        current: store.pagination.pageIndex + 1,
        limit: store.pagination.pageSize,
      },
    }),
    placeholderData: keepPreviousData,
    refetchInterval: 5_000,
  });
  const columns = useMemo<ColumnDef<IngestionAgentActivity>[]>(
    () => createIngestionAgentActivityColumns(),
    [],
  );

  return (
    <div className="space-y-4">
      {listActivities.isError ? (
        <Alert variant="destructive">
          <AlertTitle>Agent activity could not be loaded</AlertTitle>
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
        emptyDescription="Heartbeats and run signals from this agent will appear here."
        emptyTitle="No agent activity"
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
