"use client";

import type { IngestionRunState } from "@basango/domain/models";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@basango/ui/components/alert-dialog";
import { Button } from "@basango/ui/components/button";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { Table } from "@tanstack/react-table";
import { CircleCheckIcon, CircleXIcon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { useTRPC } from "#dashboard/app/trpc/client";

import type { IngestionRun } from "../types";

type TerminalRunState = Extract<IngestionRunState, "completed" | "failed">;

type IngestionRunsBulkActionsProps = {
  runIds: string[];
  table: Table<IngestionRun>;
};

export function IngestionRunsBulkActions({ runIds, table }: IngestionRunsBulkActionsProps) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const [targetState, setTargetState] = useState<TerminalRunState | undefined>(undefined);
  const selectedCount = runIds.length;
  const closeRuns = useMutation(
    trpc.operations.closeIngestionRuns.mutationOptions({
      onError(error) {
        toast.error(error.message ?? "Unable to close the selected runs.");
      },
      onSuccess(result, input) {
        if (result.updatedCount > 0) {
          toast.success(formatSuccessMessage(result.updatedCount, input.state));
        }

        if (result.unchangedCount > 0) {
          toast.info(
            `${result.unchangedCount} ${pluralize("run", result.unchangedCount)} already had that status or were unavailable.`,
          );
        }

        table.resetRowSelection();
        setTargetState(undefined);
        void Promise.all([
          queryClient.invalidateQueries({
            queryKey: trpc.operations.getIngestionAgents.queryKey(),
          }),
          queryClient.invalidateQueries({
            queryKey: trpc.operations.getIngestionSummary.queryKey(),
          }),
          queryClient.invalidateQueries({
            queryKey: trpc.operations.listIngestionRuns.queryKey(),
          }),
        ]);
      },
    }),
  );

  if (selectedCount === 0) {
    return null;
  }

  function closeSelectedRuns() {
    if (!targetState) {
      return;
    }

    closeRuns.mutate({
      runIds,
      state: targetState,
    });
  }

  return (
    <>
      <span className="text-xs text-muted-foreground">
        {selectedCount} {pluralize("run", selectedCount)} selected
      </span>
      <Button
        disabled={closeRuns.isPending}
        onClick={() => setTargetState("completed")}
        size="sm"
        type="button"
        variant="outline"
      >
        <CircleCheckIcon />
        Mark completed
      </Button>
      <Button
        disabled={closeRuns.isPending}
        onClick={() => setTargetState("failed")}
        size="sm"
        type="button"
        variant="destructive"
      >
        <CircleXIcon />
        Mark failed
      </Button>
      <AlertDialog
        onOpenChange={(open) => {
          if (!open && !closeRuns.isPending) {
            setTargetState(undefined);
          }
        }}
        open={targetState !== undefined}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Mark {selectedCount} {pluralize("run", selectedCount)} as {targetState}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              The selected runs will be assigned this final status. This also releases any agent
              that still points to one of these runs.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={closeRuns.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={closeRuns.isPending}
              onClick={closeSelectedRuns}
              variant={targetState === "failed" ? "destructive" : "default"}
            >
              {closeRuns.isPending ? "Updating…" : "Confirm"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

function formatSuccessMessage(count: number, state: TerminalRunState) {
  return `${count} ${pluralize("run", count)} marked as ${state}.`;
}

function pluralize(noun: string, count: number) {
  return count === 1 ? noun : `${noun}s`;
}
