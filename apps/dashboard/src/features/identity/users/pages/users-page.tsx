"use client";

import { Button } from "@basango/ui/components/button";
import { PlusIcon } from "lucide-react";
import { useState } from "react";

import { PageLayout } from "#dashboard/app/components/page-layout";
import { useUser } from "#dashboard/app/hooks/use-user";

import type { UserRowAction } from "../components/user-row-actions";
import { UsersTable } from "../components/users-table";
import { UserBanDialog } from "../dialogs/user-ban-dialog";
import {
  type UserConfirmAction,
  UserConfirmActionDialog,
} from "../dialogs/user-confirm-action-dialog";
import { UserCreateDialog } from "../dialogs/user-create-dialog";
import { UserEditDialog } from "../dialogs/user-edit-dialog";
import { UserPasswordDialog } from "../dialogs/user-password-dialog";
import type { ManagedUser } from "../managed-users";

type SelectedUserAction = {
  action: UserRowAction;
  user: ManagedUser;
};

export function UsersPage() {
  const currentUser = useUser();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selected, setSelected] = useState<SelectedUserAction>();

  function handleAction(action: UserRowAction, user: ManagedUser) {
    setSelected({ action, user });
  }

  function closeSelectedAction() {
    setSelected(undefined);
  }

  return (
    <PageLayout
      actions={
        <Button onClick={() => setIsCreateOpen(true)}>
          <PlusIcon data-icon="inline-start" />
          Add user
        </Button>
      }
      description="Create accounts, control access, and respond to account security issues."
      title="Users"
    >
      <UsersTable currentUserId={currentUser.user?.id} onAction={handleAction} />

      <UserCreateDialog onOpenChange={setIsCreateOpen} open={isCreateOpen} />

      {selected?.action === "edit" ? (
        <UserEditDialog
          isCurrentUser={selected.user.id === currentUser.user?.id}
          key={selected.user.id}
          onOpenChange={(open) => {
            if (!open) {
              closeSelectedAction();
            }
          }}
          open
          user={selected.user}
        />
      ) : null}

      {selected?.action === "ban" ? (
        <UserBanDialog
          key={selected.user.id}
          onOpenChange={(open) => {
            if (!open) {
              closeSelectedAction();
            }
          }}
          open
          user={selected.user}
        />
      ) : null}

      {selected?.action === "password" ? (
        <UserPasswordDialog
          key={selected.user.id}
          onOpenChange={(open) => {
            if (!open) {
              closeSelectedAction();
            }
          }}
          open
          user={selected.user}
        />
      ) : null}

      {selected && isConfirmAction(selected.action) ? (
        <UserConfirmActionDialog
          action={selected.action}
          key={`${selected.action}:${selected.user.id}`}
          onOpenChange={(open) => {
            if (!open) {
              closeSelectedAction();
            }
          }}
          open
          user={selected.user}
        />
      ) : null}
    </PageLayout>
  );
}

function isConfirmAction(action: UserRowAction): action is UserConfirmAction {
  return action === "delete" || action === "revoke" || action === "unban";
}
