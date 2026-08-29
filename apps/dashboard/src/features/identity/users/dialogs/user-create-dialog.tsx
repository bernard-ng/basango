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

import { createManagedUser, managedUsersQueryKey } from "../managed-users";
import { type CreateUserFormValues, createUserFormSchema } from "../user-form-schema";

type UserCreateDialogProps = {
  onOpenChange: (open: boolean) => void;
  open: boolean;
};

export function UserCreateDialog({ onOpenChange, open }: UserCreateDialogProps) {
  const queryClient = useQueryClient();
  const form = useZodForm(createUserFormSchema, {
    defaultValues: {
      confirmPassword: "",
      email: "",
      name: "",
      password: "",
      role: "user",
    },
  });
  const createUser = useMutation({
    mutationFn: createManagedUser,
    onError(error) {
      toast.error(error.message);
    },
    onSuccess() {
      toast.success("User created.");
      void queryClient.invalidateQueries({ queryKey: managedUsersQueryKey() });
      form.reset();
      onOpenChange(false);
    },
  });

  function handleSubmit(values: CreateUserFormValues) {
    createUser.mutate({
      email: values.email,
      name: values.name,
      password: values.password,
      role: values.role,
    });
  }

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create user</DialogTitle>
          <DialogDescription>Add an account and choose its initial access level.</DialogDescription>
        </DialogHeader>
        <form className="space-y-6" onSubmit={form.handleSubmit(handleSubmit)}>
          <FieldGroup>
            <Controller
              control={form.control}
              name="name"
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={field.name}>Name</FieldLabel>
                  <Input
                    {...field}
                    aria-invalid={fieldState.invalid}
                    autoComplete="name"
                    disabled={createUser.isPending}
                    id={field.name}
                    placeholder="Patrice Lumumba"
                  />
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
                  <Input
                    {...field}
                    aria-invalid={fieldState.invalid}
                    autoComplete="email"
                    disabled={createUser.isPending}
                    id={field.name}
                    placeholder="patrice@example.com"
                    type="email"
                  />
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
                    disabled={createUser.isPending}
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
                  {fieldState.invalid ? <FieldError errors={[fieldState.error]} /> : null}
                </Field>
              )}
            />
            <Controller
              control={form.control}
              name="password"
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={field.name}>Temporary password</FieldLabel>
                  <Input
                    {...field}
                    aria-invalid={fieldState.invalid}
                    autoComplete="new-password"
                    disabled={createUser.isPending}
                    id={field.name}
                    type="password"
                  />
                  {fieldState.invalid ? <FieldError errors={[fieldState.error]} /> : null}
                </Field>
              )}
            />
            <Controller
              control={form.control}
              name="confirmPassword"
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={field.name}>Confirm password</FieldLabel>
                  <Input
                    {...field}
                    aria-invalid={fieldState.invalid}
                    autoComplete="new-password"
                    disabled={createUser.isPending}
                    id={field.name}
                    type="password"
                  />
                  {fieldState.invalid ? <FieldError errors={[fieldState.error]} /> : null}
                </Field>
              )}
            />
          </FieldGroup>
          <SubmitButton className="w-full" isSubmitting={createUser.isPending} type="submit">
            Create user
          </SubmitButton>
        </form>
      </DialogContent>
    </Dialog>
  );
}
