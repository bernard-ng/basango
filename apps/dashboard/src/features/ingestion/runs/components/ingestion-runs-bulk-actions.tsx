"use client";

import { Button } from "@basango/ui/components/button";
import type { Table } from "@tanstack/react-table";
import { CircleCheckIcon, CircleXIcon, Trash2Icon } from "lucide-react";
import { useState } from "react";

import { useIngestionRunActions } from "../hooks/use-ingestion-run-actions";
import type { IngestionRun, IngestionRunAction } from "../types";
import { IngestionRunActionDialog } from "./ingestion-run-action-dialog";

type IngestionRunsBulkActionsProps = {
  runIds: string[];
  table: Table<IngestionRun>;
};

export function IngestionRunsBulkActions({ runIds, table }: IngestionRunsBulkActionsProps) {
  const [action, setAction] = useState<IngestionRunAction | undefined>(undefined);
  const { closeRuns, deleteRuns } = useIngestionRunActions();
  const selectedCount = runIds.length;
  const isPending = closeRuns.isPending || deleteRuns.isPending;

  if (selectedCount === 0) {
    return null;
  }

  function finishAction() {
    table.resetRowSelection();
    setAction(undefined);
  }

  function confirmAction() {
    if (!action) {
      return;
    }

    const options = { onSuccess: finishAction };

    if (action === "delete") {
      deleteRuns.mutate({ runIds }, options);
      return;
    }

    closeRuns.mutate({ runIds, state: action }, options);
  }

  return (
    <>
      <span className="text-xs text-muted-foreground">
        {selectedCount} {selectedCount === 1 ? "run" : "runs"} selected
      </span>
      <Button
        disabled={isPending}
        onClick={() => setAction("completed")}
        size="sm"
        type="button"
        variant="outline"
      >
        <CircleCheckIcon />
        Mark completed
      </Button>
      <Button
        disabled={isPending}
        onClick={() => setAction("failed")}
        size="sm"
        type="button"
        variant="outline"
      >
        <CircleXIcon />
        Mark failed
      </Button>
      <Button
        disabled={isPending}
        onClick={() => setAction("delete")}
        size="sm"
        type="button"
        variant="destructive"
      >
        <Trash2Icon />
        Delete history
      </Button>
      <IngestionRunActionDialog
        action={action}
        count={selectedCount}
        isPending={isPending}
        onConfirm={confirmAction}
        onOpenChange={(open) => {
          if (!open && !isPending) {
            setAction(undefined);
          }
        }}
      />
    </>
  );
}
