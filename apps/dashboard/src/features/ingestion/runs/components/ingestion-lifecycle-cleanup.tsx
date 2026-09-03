"use client";

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
import { Trash2Icon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { useTRPC } from "#dashboard/app/trpc/client";

type IngestionLifecycleCleanupProps = {
  onCleaned: () => void;
};

export function IngestionLifecycleCleanup({ onCleaned }: IngestionLifecycleCleanupProps) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const resetLifecycle = useMutation(
    trpc.operations.resetIngestionLifecycle.mutationOptions({
      onError(error) {
        toast.error(error.message ?? "Unable to clean ingestion monitoring data.");
      },
      onSuccess(result) {
        toast.success(
          `Cleaned ${result.deletedRunCount.toLocaleString()} runs, ${result.deletedActivityCount.toLocaleString()} events, and ${result.deletedAgentCount.toLocaleString()} agents.`,
        );
        setIsOpen(false);
        onCleaned();
        invalidateIngestionQueries();
      },
    }),
  );

  function invalidateIngestionQueries() {
    void Promise.all([
      queryClient.invalidateQueries(trpc.operations.getIngestionAgents.queryFilter()),
      queryClient.invalidateQueries(trpc.operations.getIngestionAgentDetails.queryFilter()),
      queryClient.invalidateQueries(trpc.operations.getIngestionSummary.queryFilter()),
      queryClient.invalidateQueries(trpc.operations.getIngestionThroughput.queryFilter()),
      queryClient.invalidateQueries(trpc.operations.getIngestionRunDetails.queryFilter()),
      queryClient.invalidateQueries(trpc.operations.listIngestionAgentActivities.queryFilter()),
      queryClient.invalidateQueries(trpc.operations.listIngestionRunActivities.queryFilter()),
      queryClient.invalidateQueries(trpc.operations.listIngestionRuns.queryFilter()),
    ]);
  }

  return (
    <>
      <Button
        disabled={resetLifecycle.isPending}
        onClick={() => setIsOpen(true)}
        size="sm"
        type="button"
        variant="destructive"
      >
        <Trash2Icon />
        Clean
      </Button>
      <AlertDialog
        onOpenChange={(open) => {
          if (!resetLifecycle.isPending) {
            setIsOpen(open);
          }
        }}
        open={isOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Clean all ingestion monitoring data?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently deletes crawler agent health, run history, and ingestion events.
              Articles, sources, categories, and reader data will not be deleted. Active crawlers
              will reappear when they send their next signal. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={resetLifecycle.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={resetLifecycle.isPending}
              onClick={() => resetLifecycle.mutate()}
              variant="destructive"
            >
              {resetLifecycle.isPending ? "Cleaning…" : "Clean data"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
