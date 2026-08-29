import type { RouterOutputs } from "@basango/api/trpc/routers/_app";
import { Badge } from "@basango/ui/components/badge";
import type { ColumnDef } from "@tanstack/react-table";

import { formatNumber } from "#dashboard/app/utils/formatters";

import { type CategoryRowAction, CategoryRowActions } from "./category-row-actions";

export type ManagedCategory = RouterOutputs["categories"]["list"][number];

type CreateCategoriesColumnsOptions = {
  onAction: (action: CategoryRowAction, category: ManagedCategory) => void;
};

export function createCategoriesColumns({
  onAction,
}: CreateCategoriesColumnsOptions): ColumnDef<ManagedCategory>[] {
  return [
    {
      accessorKey: "name",
      cell: ({ row }) => (
        <div className="grid min-w-48 gap-0.5">
          <span className="truncate font-medium">{row.original.name}</span>
          <span className="text-muted-foreground truncate font-mono text-xs">
            {row.original.slug}
          </span>
        </div>
      ),
      header: "Category",
    },
    {
      accessorKey: "candidates",
      cell: ({ row }) => (
        <div className="flex min-w-64 max-w-xl flex-wrap gap-1.5">
          {row.original.candidates.map((candidate) => (
            <Badge key={candidate} variant="secondary">
              {candidate}
            </Badge>
          ))}
        </div>
      ),
      enableSorting: false,
      header: "Candidate labels",
    },
    {
      accessorKey: "weight",
      cell: ({ row }) => <span className="tabular-nums">{row.original.weight}</span>,
      header: "Weight",
    },
    {
      accessorKey: "articleCount",
      cell: ({ row }) => (
        <span className="tabular-nums">{formatNumber(row.original.articleCount)}</span>
      ),
      header: "Assigned",
    },
    {
      cell: ({ row }) => <CategoryRowActions category={row.original} onAction={onAction} />,
      enableHiding: false,
      enableSorting: false,
      header: () => <span className="sr-only">Actions</span>,
      id: "actions",
    },
  ];
}
