"use client";

import type { RouterOutputs } from "@basango/api/trpc/routers/_app";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@basango/ui/components/dialog";

import { SourceEditForm } from "../forms/source-edit-form";

type SourceEditDialogProps = {
  onOpenChange: (open: boolean) => void;
  open: boolean;
  source: RouterOutputs["sources"]["getById"];
};

export function SourceEditDialog({ onOpenChange, open, source }: SourceEditDialogProps) {
  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="max-h-[calc(100svh-2rem)] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Edit source</DialogTitle>
          <DialogDescription>
            Update the publication identity and website shown throughout Basango.
          </DialogDescription>
        </DialogHeader>
        <SourceEditForm key={source.id} onSuccess={() => onOpenChange(false)} source={source} />
      </DialogContent>
    </Dialog>
  );
}
