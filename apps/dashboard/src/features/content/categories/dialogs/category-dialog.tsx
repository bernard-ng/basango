"use client";

import type { RouterOutputs } from "@basango/api/trpc/routers/_app";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@basango/ui/components/dialog";

import { CategoryForm } from "../forms/category-form";

type ManagedCategory = RouterOutputs["categories"]["list"][number];

type CategoryDialogProps = {
  category?: ManagedCategory;
  onOpenChange: (open: boolean) => void;
  open: boolean;
};

export function CategoryDialog({ category, onOpenChange, open }: CategoryDialogProps) {
  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="max-h-[calc(100svh-2rem)] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{category ? "Edit category" : "Create category"}</DialogTitle>
          <DialogDescription>
            {category
              ? "Rename the category or tune the source labels used to classify articles."
              : "Add a destination for article clustering and its matching source labels."}
          </DialogDescription>
        </DialogHeader>
        <CategoryForm
          category={category}
          key={category?.id ?? "new-category"}
          onSuccess={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
