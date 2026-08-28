"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { useTRPC } from "#dashboard/app/trpc/client";

export function useIngestionRunActions() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const closeRuns = useMutation(
    trpc.operations.closeIngestionRuns.mutationOptions({
      onError(error) {
        toast.error(error.message ?? "Unable to update the selected runs.");
      },
      onSuccess(result, input) {
        if (result.updatedCount > 0) {
          toast.success(
            `${result.updatedCount} ${pluralize("run", result.updatedCount)} marked as ${input.state}.`,
          );
        }

        if (result.unchangedCount > 0) {
          toast.info(
            `${result.unchangedCount} ${pluralize("run", result.unchangedCount)} already had that status or were unavailable.`,
          );
        }

        invalidateRunQueries(false);
      },
    }),
  );
  const deleteRuns = useMutation(
    trpc.operations.deleteIngestionRuns.mutationOptions({
      onError(error) {
        toast.error(error.message ?? "Unable to delete the selected run history.");
      },
      onSuccess(result) {
        if (result.deletedCount > 0) {
          toast.success(
            `${result.deletedCount} ${pluralize("run history", result.deletedCount, "run histories")} deleted.`,
          );
        }

        if (result.skippedCount > 0) {
          toast.info(
            `${result.skippedCount} active or unavailable ${pluralize("run", result.skippedCount)} were not deleted.`,
          );
        }

        invalidateRunQueries(true);
      },
    }),
  );

  function invalidateRunQueries(includeThroughput: boolean) {
    const invalidations = [
      queryClient.invalidateQueries({
        queryKey: trpc.operations.getIngestionAgents.queryKey(),
      }),
      queryClient.invalidateQueries({
        queryKey: trpc.operations.getIngestionSummary.queryKey(),
      }),
      queryClient.invalidateQueries({
        queryKey: trpc.operations.listIngestionRuns.queryKey(),
      }),
    ];

    if (includeThroughput) {
      invalidations.push(
        queryClient.invalidateQueries({
          queryKey: trpc.operations.getIngestionThroughput.queryKey(),
        }),
      );
    }

    void Promise.all(invalidations);
  }

  return { closeRuns, deleteRuns };
}

function pluralize(singular: string, count: number, plural = `${singular}s`) {
  return count === 1 ? singular : plural;
}
