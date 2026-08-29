"use client";

import type { RouterOutputs } from "@basango/api/trpc/routers/_app";
import { Button } from "@basango/ui/components/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@basango/ui/components/dropdown-menu";
import { MoreHorizontalIcon, PencilIcon, Trash2Icon } from "lucide-react";

type ManagedCategory = RouterOutputs["categories"]["list"][number];

export type CategoryRowAction = "delete" | "edit";

type CategoryRowActionsProps = {
  category: ManagedCategory;
  onAction: (action: CategoryRowAction, category: ManagedCategory) => void;
};

export function CategoryRowActions({ category, onAction }: CategoryRowActionsProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button size="icon-sm" variant="ghost" />}>
        <MoreHorizontalIcon />
        <span className="sr-only">Actions for {category.name}</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => onAction("edit", category)}>
          <PencilIcon />
          Edit category
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => onAction("delete", category)} variant="destructive">
          <Trash2Icon />
          Delete category
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
