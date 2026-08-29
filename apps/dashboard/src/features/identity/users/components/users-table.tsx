"use client";

import { Alert, AlertDescription, AlertTitle } from "@basango/ui/components/alert";
import { Button } from "@basango/ui/components/button";
import { DataTable, DataTableToolbar } from "@basango/ui/components/data-table";
import { useTableStore } from "@basango/ui/stores/table-store";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";
import { useMemo } from "react";

import { type ManagedUser, managedUsersQueryOptions } from "../managed-users";
import type { UserRowAction } from "./user-row-actions";
import { createUsersColumns } from "./users-columns";

const TABLE_ID = "identity.users";

type UsersTableProps = {
  currentUserId?: string;
  onAction: (action: UserRowAction, user: ManagedUser) => void;
};

export function UsersTable({ currentUserId, onAction }: UsersTableProps) {
  const store = useTableStore(TABLE_ID, {
    pagination: { pageIndex: 0, pageSize: 10 },
    sorting: [{ desc: true, id: "createdAt" }],
  });
  const sort = store.sorting[0];
  const users = useQuery({
    ...managedUsersQueryOptions({
      limit: store.pagination.pageSize,
      page: store.pagination.pageIndex + 1,
      search: store.globalFilter,
      sortBy: sort?.id,
      sortDirection: sort?.desc ? "desc" : "asc",
    }),
    enabled: typeof document !== "undefined",
    placeholderData: keepPreviousData,
  });
  const columns = useMemo<ColumnDef<ManagedUser>[]>(
    () => createUsersColumns({ currentUserId, onAction }),
    [currentUserId, onAction],
  );
  const pageCount = Math.max(1, Math.ceil((users.data?.total ?? 0) / store.pagination.pageSize));

  return (
    <div className="space-y-4">
      {users.isError ? (
        <Alert variant="destructive">
          <AlertTitle>Unable to load users</AlertTitle>
          <AlertDescription className="flex items-center justify-between gap-3">
            <span>{users.error.message}</span>
            <Button onClick={() => users.refetch()} size="sm" type="button" variant="outline">
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      ) : null}

      <DataTable
        columns={columns}
        data={users.data?.users ?? []}
        emptyDescription="Try another search or create a new account."
        emptyTitle="No users found"
        getRowId={(user) => user.id}
        height="h-[34rem]"
        loading={users.isPending}
        pageCount={pageCount}
        rowCount={users.data?.total}
        tableId={TABLE_ID}
        toolbar={({ store: tableStore, table }) => (
          <DataTableToolbar
            filterPlaceholder="Search users by email…"
            store={tableStore}
            table={table}
          />
        )}
      />
    </div>
  );
}
