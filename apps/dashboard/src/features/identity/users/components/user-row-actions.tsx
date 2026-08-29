"use client";

import { Button } from "@basango/ui/components/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@basango/ui/components/dropdown-menu";
import {
  BanIcon,
  KeyRoundIcon,
  LogOutIcon,
  MoreHorizontalIcon,
  PencilIcon,
  ShieldCheckIcon,
  Trash2Icon,
} from "lucide-react";

import type { ManagedUser } from "../managed-users";

export type UserRowAction = "ban" | "delete" | "edit" | "password" | "revoke" | "unban";

type UserRowActionsProps = {
  isCurrentUser: boolean;
  onAction: (action: UserRowAction, user: ManagedUser) => void;
  user: ManagedUser;
};

export function UserRowActions({ isCurrentUser, onAction, user }: UserRowActionsProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button size="icon-sm" variant="ghost" />}>
        <MoreHorizontalIcon />
        <span className="sr-only">Actions for {user.name}</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => onAction("edit", user)}>
          <PencilIcon />
          Edit user
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onAction("password", user)}>
          <KeyRoundIcon />
          Set password
        </DropdownMenuItem>
        <DropdownMenuItem disabled={isCurrentUser} onClick={() => onAction("revoke", user)}>
          <LogOutIcon />
          Revoke sessions
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        {user.banned ? (
          <DropdownMenuItem onClick={() => onAction("unban", user)}>
            <ShieldCheckIcon />
            Unban account
          </DropdownMenuItem>
        ) : (
          <DropdownMenuItem
            disabled={isCurrentUser}
            onClick={() => onAction("ban", user)}
            variant="destructive"
          >
            <BanIcon />
            Ban account
          </DropdownMenuItem>
        )}
        <DropdownMenuItem
          disabled={isCurrentUser}
          onClick={() => onAction("delete", user)}
          variant="destructive"
        >
          <Trash2Icon />
          Delete user
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
