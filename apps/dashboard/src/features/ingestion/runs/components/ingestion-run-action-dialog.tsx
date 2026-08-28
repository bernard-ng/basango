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

import type { IngestionRunAction } from "../types";

type IngestionRunActionDialogProps = {
  action: IngestionRunAction | undefined;
  count: number;
  isPending: boolean;
  onConfirm: () => void;
  onOpenChange: (open: boolean) => void;
};

export function IngestionRunActionDialog({
  action,
  count,
  isPending,
  onConfirm,
  onOpenChange,
}: IngestionRunActionDialogProps) {
  const isDelete = action === "delete";

  return (
    <AlertDialog onOpenChange={onOpenChange} open={action !== undefined}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {isDelete
              ? `Permanently delete ${count} ${pluralize("run history", count, "run histories")}?`
              : `Mark ${count} ${pluralize("run", count)} as ${action}?`}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {isDelete
              ? "Completed and failed runs, including their activity records, will be permanently deleted. Active runs will be skipped. This cannot be undone."
              : "The selected runs will be assigned this final status. This also releases any agent that still points to one of these runs."}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            disabled={isPending}
            onClick={onConfirm}
            variant={isDelete || action === "failed" ? "destructive" : "default"}
          >
            {isPending ? (isDelete ? "Deleting…" : "Updating…") : isDelete ? "Delete" : "Confirm"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

function pluralize(singular: string, count: number, plural = `${singular}s`) {
  return count === 1 ? singular : plural;
}
