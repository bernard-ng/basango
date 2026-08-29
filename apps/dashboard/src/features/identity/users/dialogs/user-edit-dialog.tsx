"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@basango/ui/components/dialog";
import { Field, FieldError, FieldGroup, FieldLabel } from "@basango/ui/components/field";
import { Input } from "@basango/ui/components/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@basango/ui/components/select";
import { SubmitButton } from "@basango/ui/components/submit-button";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Controller } from "react-hook-form";
import { toast } from "sonner";

import { useZodForm } from "#dashboard/app/hooks/use-zod-form";

import { type ManagedUser, managedUsersQueryKey, updateManagedUser } from "../managed-users";
import { type EditUserFormValues, editUserFormSchema } from "../user-form-schema";

type UserEditDialogProps = {
  isCurrentUser: boolean;
  onOpenChange: (open: boolean) => void;
  open: boolean;
  user: ManagedUser;
};

export function UserEditDialog({ isCurrentUser, onOpenChange, open, user }: UserEditDialogProps) {
  const queryClient = useQueryClient();
  const form = useZodForm(editUserFormSchema, {
    defaultValues: {
      email: user.email,
      name: user.name,
      role: user.role?.split(",").includes("admin") ? "admin" : "user",
    },
  });
  const updateUser = useMutation({
    mutationFn: updateManagedUser,
    onError(error) {
      toast.error(error.message);
    },
    onSuccess() {
      toast.success("User updated.");
      void queryClient.invalidateQueries({ queryKey: managedUsersQueryKey() });
      onOpenChange(false);
    },
  });

  function handleSubmit(values: EditUserFormValues) {
    updateUser.mutate({ ...values, userId: user.id });
  }

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit user</DialogTitle>
          <DialogDescription>Update {user.name}&apos;s profile and access level.</DialogDescription>
        </DialogHeader>
        <form className="space-y-6" onSubmit={form.handleSubmit(handleSubmit)}>
          <FieldGroup>
            <Controller
              control={form.control}
              name="name"
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={field.name}>Name</FieldLabel>
                  <Input {...field} disabled={updateUser.isPending} id={field.name} />
                  {fieldState.invalid ? <FieldError errors={[fieldState.error]} /> : null}
                </Field>
              )}
            />
            <Controller
              control={form.control}
              name="email"
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={field.name}>Email</FieldLabel>
                  <Input {...field} disabled={updateUser.isPending} id={field.name} type="email" />
                  {fieldState.invalid ? <FieldError errors={[fieldState.error]} /> : null}
                </Field>
              )}
            />
            <Controller
              control={form.control}
              name="role"
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={field.name}>Role</FieldLabel>
                  <Select
                    disabled={isCurrentUser || updateUser.isPending}
                    onValueChange={field.onChange}
                    value={field.value}
                  >
                    <SelectTrigger id={field.name}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="user">User</SelectItem>
                      <SelectItem value="admin">Administrator</SelectItem>
                    </SelectContent>
                  </Select>
                  {isCurrentUser ? (
                    <p className="text-xs text-muted-foreground">
                      You cannot change your own administrator role.
                    </p>
                  ) : null}
                  {fieldState.invalid ? <FieldError errors={[fieldState.error]} /> : null}
                </Field>
              )}
            />
          </FieldGroup>
          <SubmitButton className="w-full" isSubmitting={updateUser.isPending} type="submit">
            Save changes
          </SubmitButton>
        </form>
      </DialogContent>
    </Dialog>
  );
}
