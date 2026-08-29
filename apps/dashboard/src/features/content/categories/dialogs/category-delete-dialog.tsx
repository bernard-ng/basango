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
import { toast } from "sonner";

import { useTRPC } from "#dashboard/app/trpc/client";

type ManagedCategory = RouterOutputs["categories"]["list"][number];

type CategoryDeleteDialogProps = {
  category: ManagedCategory;
  onOpenChange: (open: boolean) => void;
  open: boolean;
};

export function CategoryDeleteDialog({ category, onOpenChange, open }: CategoryDeleteDialogProps) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const deleteCategory = useMutation(
    trpc.categories.delete.mutationOptions({
      onError(error) {
        toast.error(error.message || "Unable to delete category.");
      },
      onSuccess() {
        toast.success("Category deleted. Articles are queued for clustering again.");
        void queryClient.invalidateQueries({ queryKey: trpc.categories.list.queryKey() });
        void queryClient.invalidateQueries({ queryKey: trpc.categories.stats.queryKey() });
        void queryClient.invalidateQueries({ queryKey: trpc.articles.list.queryKey() });
        onOpenChange(false);
      },
    }),
  );

  return (
    <AlertDialog onOpenChange={onOpenChange} open={open}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete {category.name}?</AlertDialogTitle>
          <AlertDialogDescription>
            Its {category.articleCount} assigned articles will be reclassified using the remaining
            categories. This cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={deleteCategory.isPending}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            disabled={deleteCategory.isPending}
            onClick={() => deleteCategory.mutate({ id: category.id })}
            variant="destructive"
          >
            {deleteCategory.isPending ? "Deleting…" : "Delete category"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
