"use client";

import { Button } from "@basango/ui/components/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@basango/ui/components/dropdown-menu";
import { useNavigate } from "@tanstack/react-router";
import {
  CircleCheckIcon,
  CircleXIcon,
  CopyIcon,
  EyeIcon,
  MoreHorizontalIcon,
  Trash2Icon,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { useIngestionRunActions } from "../hooks/use-ingestion-run-actions";
import type { IngestionRun, IngestionRunAction } from "../types";
import { IngestionRunActionDialog } from "./ingestion-run-action-dialog";

type IngestionRunRowActionsProps = {
  run: IngestionRun;
};

export function IngestionRunRowActions({ run }: IngestionRunRowActionsProps) {
  const navigate = useNavigate();
  const [action, setAction] = useState<IngestionRunAction | undefined>(undefined);
  const { closeRuns, deleteRuns } = useIngestionRunActions();
  const isPending = closeRuns.isPending || deleteRuns.isPending;
  const isTerminal = run.state === "completed" || run.state === "failed";

  async function copyRunId() {
    try {
      await navigator.clipboard.writeText(run.id);
      toast.success("Run ID copied.");
    } catch {
      toast.error("Unable to copy the run ID.");
    }
  }

  function confirmAction() {
    if (!action) {
      return;
    }

    const options = { onSuccess: () => setAction(undefined) };

    if (action === "delete") {
      deleteRuns.mutate({ runIds: [run.id] }, options);
      return;
    }

    closeRuns.mutate({ runIds: [run.id], state: action }, options);
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger render={<Button size="icon-sm" variant="ghost" />}>
          <MoreHorizontalIcon />
          <span className="sr-only">Actions for run {run.id}</span>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem
            onClick={() => navigate({ params: { runId: run.id }, to: "/runs/$runId" })}
          >
            <EyeIcon />
            View details
          </DropdownMenuItem>
          <DropdownMenuItem onClick={copyRunId}>
            <CopyIcon />
            Copy ID
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            disabled={run.state === "completed"}
            onClick={() => setAction("completed")}
          >
            <CircleCheckIcon />
            Mark completed
          </DropdownMenuItem>
          <DropdownMenuItem disabled={run.state === "failed"} onClick={() => setAction("failed")}>
            <CircleXIcon />
            Mark failed
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            disabled={!isTerminal}
            onClick={() => setAction("delete")}
            variant="destructive"
          >
            <Trash2Icon />
            Delete history
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <IngestionRunActionDialog
        action={action}
        count={1}
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
