"use client";

import type { RouterOutputs } from "@basango/api/trpc/routers/_app";
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
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";

import { useTRPC } from "#dashboard/app/trpc/client";

type SourceDeleteDialogProps = {
  onOpenChange: (open: boolean) => void;
  open: boolean;
  source: RouterOutputs["sources"]["getById"];
};

export function SourceDeleteDialog({ onOpenChange, open, source }: SourceDeleteDialogProps) {
  const trpc = useTRPC();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const deleteSource = useMutation(
    trpc.sources.delete.mutationOptions({
      onError(error) {
        toast.error(error.message ?? "Unable to delete source.");
      },
      onSuccess() {
        toast.success("Source deleted.");
        void Promise.all([
          queryClient.invalidateQueries({
            queryKey: trpc.sources.list.queryKey(),
          }),
          queryClient.invalidateQueries({
            queryKey: trpc.reports.getDashboardOverview.queryKey(),
          }),
          queryClient.invalidateQueries({
            queryKey: trpc.articles.list.queryKey(),
          }),
        ]);
        onOpenChange(false);
        void navigate({ to: "/sources" });
      },
    }),
  );

  return (
    <AlertDialog onOpenChange={onOpenChange} open={open}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete {source.name}?</AlertDialogTitle>
          <AlertDialogDescription>
            This will remove the source and delete its crawled articles. This action cannot be
            undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={deleteSource.isPending}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            disabled={deleteSource.isPending}
            onClick={() => deleteSource.mutate({ id: source.id })}
            variant="destructive"
          >
            {deleteSource.isPending ? "Deleting…" : "Delete source"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
