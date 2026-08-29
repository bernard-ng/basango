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
import { SubmitButton } from "@basango/ui/components/submit-button";
import { useMutation } from "@tanstack/react-query";
import { Controller } from "react-hook-form";
import { toast } from "sonner";

import { useZodForm } from "#dashboard/app/hooks/use-zod-form";

import { type ManagedUser, setManagedUserPassword } from "../managed-users";
import { type SetUserPasswordFormValues, setUserPasswordFormSchema } from "../user-form-schema";

type UserPasswordDialogProps = {
  onOpenChange: (open: boolean) => void;
  open: boolean;
  user: ManagedUser;
};

export function UserPasswordDialog({ onOpenChange, open, user }: UserPasswordDialogProps) {
  const form = useZodForm(setUserPasswordFormSchema, {
    defaultValues: {
      confirmPassword: "",
      password: "",
    },
  });
  const setPassword = useMutation({
    mutationFn: ({ password }: { password: string }) => setManagedUserPassword(user.id, password),
    onError(error) {
      toast.error(error.message);
    },
    onSuccess() {
      toast.success("Password updated.");
      form.reset();
      onOpenChange(false);
    },
  });

  function handleSubmit(values: SetUserPasswordFormValues) {
    setPassword.mutate({ password: values.password });
  }

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Set password</DialogTitle>
          <DialogDescription>Choose a new password for {user.name}.</DialogDescription>
        </DialogHeader>
        <form className="space-y-6" onSubmit={form.handleSubmit(handleSubmit)}>
          <FieldGroup>
            <Controller
              control={form.control}
              name="password"
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={field.name}>New password</FieldLabel>
                  <Input
                    {...field}
                    autoComplete="new-password"
                    disabled={setPassword.isPending}
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
                    autoComplete="new-password"
                    disabled={setPassword.isPending}
                    id={field.name}
                    type="password"
                  />
                  {fieldState.invalid ? <FieldError errors={[fieldState.error]} /> : null}
                </Field>
              )}
            />
          </FieldGroup>
          <SubmitButton className="w-full" isSubmitting={setPassword.isPending} type="submit">
            Update password
          </SubmitButton>
        </form>
      </DialogContent>
    </Dialog>
  );
}
