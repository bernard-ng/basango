"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@basango/ui/components/dialog";
import { useCallback } from "react";

import { SourceForm } from "../forms/source-form";
import { useSourceParams } from "../hooks/use-source-params";

export function SourceCreateDialog() {
  const { createSource, setParams } = useSourceParams();
  const isOpen = Boolean(createSource);

  const openDialog = useCallback(() => {
    void setParams({ createSource: true });
  }, [setParams]);

  const closeDialog = useCallback(() => {
    void setParams(null);
  }, [setParams]);

  return (
    <Dialog
      onOpenChange={(open) => {
        if (open) {
          openDialog();
        } else {
          closeDialog();
        }
      }}
      open={isOpen}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create a new source</DialogTitle>
          <DialogDescription>Add a news outlet to start tracking its articles.</DialogDescription>
        </DialogHeader>
        <SourceForm onSuccess={closeDialog} />
      </DialogContent>
    </Dialog>
  );
}
