import { Avatar, AvatarFallback, AvatarImage } from "@basango/ui/components/avatar";
import { Badge } from "@basango/ui/components/badge";
import type { ColumnDef } from "@tanstack/react-table";

import type { ManagedUser } from "../managed-users";
import { type UserRowAction, UserRowActions } from "./user-row-actions";

const dateFormatter = new Intl.DateTimeFormat("en", {
  dateStyle: "medium",
});

type CreateUsersColumnsOptions = {
  currentUserId?: string;
  onAction: (action: UserRowAction, user: ManagedUser) => void;
};

export function createUsersColumns({
  currentUserId,
  onAction,
}: CreateUsersColumnsOptions): ColumnDef<ManagedUser>[] {
  return [
    {
      accessorKey: "name",
      cell: ({ row }) => {
        const isCurrentUser = row.original.id === currentUserId;

        return (
          <div className="flex items-center gap-3">
            <Avatar className="size-9">
              <AvatarImage alt="" src={row.original.image ?? undefined} />
              <AvatarFallback>{getInitials(row.original.name)}</AvatarFallback>
            </Avatar>
            <div className="grid min-w-0 gap-0.5">
              <div className="flex items-center gap-2">
                <span className="truncate font-medium">{row.original.name}</span>
                {isCurrentUser ? <Badge variant="outline">You</Badge> : null}
              </div>
              <span className="truncate text-xs text-muted-foreground">{row.original.email}</span>
            </div>
          </div>
        );
      },
      header: "User",
    },
    {
      accessorKey: "role",
      cell: ({ row }) => {
        const isAdmin = row.original.role?.split(",").includes("admin");

        return (
          <Badge variant={isAdmin ? "default" : "secondary"}>{isAdmin ? "Admin" : "User"}</Badge>
        );
      },
      enableSorting: false,
      header: "Role",
    },
    {
      accessorKey: "banned",
      cell: ({ row }) => <AccountStatus user={row.original} />,
      enableSorting: false,
      header: "Status",
    },
    {
      accessorKey: "createdAt",
      cell: ({ row }) => (
        <time
          className="text-muted-foreground"
          dateTime={new Date(row.original.createdAt).toISOString()}
        >
          {dateFormatter.format(new Date(row.original.createdAt))}
        </time>
      ),
      header: "Created",
    },
    {
      cell: ({ row }) => (
        <UserRowActions
          isCurrentUser={row.original.id === currentUserId}
          onAction={onAction}
          user={row.original}
        />
      ),
      enableHiding: false,
      enableSorting: false,
      header: () => <span className="sr-only">Actions</span>,
      id: "actions",
    },
  ];
}

function AccountStatus({ user }: { user: ManagedUser }) {
  if (!user.banned) {
    return <Badge variant="secondary">Active</Badge>;
  }

  const expiresAt = user.banExpires ? new Date(user.banExpires) : undefined;
  const isExpired = expiresAt ? expiresAt.getTime() <= Date.now() : false;

  return (
    <div className="grid gap-1">
      <Badge variant={isExpired ? "outline" : "destructive"}>
        {isExpired ? "Ban expired" : "Banned"}
      </Badge>
      {user.banReason ? (
        <span className="max-w-48 truncate text-xs text-muted-foreground" title={user.banReason}>
          {user.banReason}
        </span>
      ) : null}
    </div>
  );
}

function getInitials(name: string) {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}
