"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@basango/ui/components/alert-dialog";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import {
  type ManagedUser,
  deleteManagedUser,
  managedUsersQueryKey,
  revokeManagedUserSessions,
  unbanManagedUser,
} from "../managed-users";

export type UserConfirmAction = "delete" | "revoke" | "unban";

const actionContent = {
  delete: {
    confirmLabel: "Delete user",
    description: "This permanently deletes the user, their login methods, and all active sessions.",
    successMessage: "User deleted.",
    title: "Delete this user?",
    variant: "destructive",
  },
  revoke: {
    confirmLabel: "Revoke sessions",
    description: "The user will be signed out on every device and must sign in again.",
    successMessage: "All user sessions revoked.",
    title: "Sign this user out everywhere?",
    variant: "default",
  },
  unban: {
    confirmLabel: "Unban account",
    description: "The user will be able to sign in again immediately.",
    successMessage: "Account unbanned.",
    title: "Unban this account?",
    variant: "default",
  },
} as const;

type UserConfirmActionDialogProps = {
  action: UserConfirmAction;
  onOpenChange: (open: boolean) => void;
  open: boolean;
  user: ManagedUser;
};

export function UserConfirmActionDialog({
  action,
  onOpenChange,
  open,
  user,
}: UserConfirmActionDialogProps) {
  const queryClient = useQueryClient();
  const content = actionContent[action];
  const performAction = useMutation({
    mutationFn: async () => {
      if (action === "delete") {
        return deleteManagedUser(user.id);
      }

      if (action === "revoke") {
        return revokeManagedUserSessions(user.id);
      }

      return unbanManagedUser(user.id);
    },
    onError(error) {
      toast.error(error.message);
    },
    onSuccess() {
      toast.success(content.successMessage);
      void queryClient.invalidateQueries({ queryKey: managedUsersQueryKey() });
      onOpenChange(false);
    },
  });

  return (
    <AlertDialog onOpenChange={onOpenChange} open={open}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{content.title}</AlertDialogTitle>
          <AlertDialogDescription>
            {user.name} ({user.email}). {content.description}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={performAction.isPending}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            disabled={performAction.isPending}
            onClick={() => performAction.mutate()}
            variant={content.variant}
          >
            {performAction.isPending ? "Working…" : content.confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
