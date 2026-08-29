"use client";

import { DataTable, DataTableToolbar } from "@basango/ui/components/data-table";
import { useTableStore } from "@basango/ui/stores/table-store";
import type { ColumnDef } from "@tanstack/react-table";
import { useMemo } from "react";

import { type ManagedCategory, createCategoriesColumns } from "./categories-columns";
import type { CategoryRowAction } from "./category-row-actions";

const TABLE_ID = "content.categories";

type CategoriesTableProps = {
  categories: ManagedCategory[];
  isLoading: boolean;
  onAction: (action: CategoryRowAction, category: ManagedCategory) => void;
};

export function CategoriesTable({ categories, isLoading, onAction }: CategoriesTableProps) {
  const store = useTableStore(TABLE_ID, {
    pagination: { pageIndex: 0, pageSize: 10 },
    sorting: [{ desc: true, id: "weight" }],
  });
  const columns = useMemo<ColumnDef<ManagedCategory>[]>(
    () => createCategoriesColumns({ onAction }),
    [onAction],
  );
  const filteredCategories = filterCategories(categories, store.globalFilter);
  const sortedCategories = sortCategories(filteredCategories, store.sorting[0]);
  const pageCount = Math.max(1, Math.ceil(sortedCategories.length / store.pagination.pageSize));
  const pageIndex = Math.min(store.pagination.pageIndex, pageCount - 1);
  const offset = pageIndex * store.pagination.pageSize;
  const visibleCategories = sortedCategories.slice(offset, offset + store.pagination.pageSize);

  return (
    <DataTable
      columns={columns}
      data={visibleCategories}
      emptyDescription="Try another search or create a category."
      emptyTitle="No categories found"
      getRowId={(category) => category.id}
      height="h-[34rem]"
      loading={isLoading}
      pageCount={pageCount}
      rowCount={sortedCategories.length}
      tableId={TABLE_ID}
      toolbar={({ store: tableStore, table }) => (
        <DataTableToolbar
          filterPlaceholder="Search categories or candidate labels…"
          store={tableStore}
          table={table}
        />
      )}
    />
  );
}

function filterCategories(categories: readonly ManagedCategory[], query: string) {
  const normalizedQuery = query.trim().toLocaleLowerCase("fr-CD");

  if (!normalizedQuery) {
    return [...categories];
  }

  return categories.filter((category) => {
    const searchable = [category.name, category.slug, ...category.candidates]
      .join(" ")
      .toLocaleLowerCase("fr-CD");

    return searchable.includes(normalizedQuery);
  });
}

function sortCategories(
  categories: readonly ManagedCategory[],
  sorting: { desc: boolean; id: string } | undefined,
) {
  if (!sorting) {
    return [...categories];
  }

  const direction = sorting.desc ? -1 : 1;

  return [...categories].sort((left, right) => {
    if (sorting.id === "weight" || sorting.id === "articleCount") {
      return (left[sorting.id] - right[sorting.id]) * direction;
    }

    return left.name.localeCompare(right.name, "fr-CD") * direction;
  });
}
