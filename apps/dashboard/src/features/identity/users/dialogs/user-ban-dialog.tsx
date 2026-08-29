"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@basango/ui/components/dialog";
import { Field, FieldError, FieldGroup, FieldLabel } from "@basango/ui/components/field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@basango/ui/components/select";
import { SubmitButton } from "@basango/ui/components/submit-button";
import { Textarea } from "@basango/ui/components/textarea";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Controller } from "react-hook-form";
import { toast } from "sonner";

import { useZodForm } from "#dashboard/app/hooks/use-zod-form";

import { type ManagedUser, banManagedUser, managedUsersQueryKey } from "../managed-users";
import {
  type BanUserFormValues,
  banUserFormSchema,
  getBanDurationSeconds,
} from "../user-form-schema";

type UserBanDialogProps = {
  onOpenChange: (open: boolean) => void;
  open: boolean;
  user: ManagedUser;
};

export function UserBanDialog({ onOpenChange, open, user }: UserBanDialogProps) {
  const queryClient = useQueryClient();
  const form = useZodForm(banUserFormSchema, {
    defaultValues: {
      banReason: "",
      duration: "permanent",
    },
  });
  const banUser = useMutation({
    mutationFn: banManagedUser,
    onError(error) {
      toast.error(error.message);
    },
    onSuccess() {
      toast.success("Account banned and active sessions revoked.");
      void queryClient.invalidateQueries({ queryKey: managedUsersQueryKey() });
      form.reset();
      onOpenChange(false);
    },
  });

  function handleSubmit(values: BanUserFormValues) {
    banUser.mutate({
      banExpiresIn: getBanDurationSeconds(values.duration),
      banReason: values.banReason,
      userId: user.id,
    });
  }

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Ban {user.name}?</DialogTitle>
          <DialogDescription>
            The user will be signed out everywhere and blocked from signing in until the ban
            expires.
          </DialogDescription>
        </DialogHeader>
        <form className="space-y-6" onSubmit={form.handleSubmit(handleSubmit)}>
          <FieldGroup>
            <Controller
              control={form.control}
              name="banReason"
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={field.name}>Reason</FieldLabel>
                  <Textarea
                    {...field}
                    disabled={banUser.isPending}
                    id={field.name}
                    placeholder="Explain why this account is being banned"
                    rows={4}
                  />
                  {fieldState.invalid ? <FieldError errors={[fieldState.error]} /> : null}
                </Field>
              )}
            />
            <Controller
              control={form.control}
              name="duration"
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={field.name}>Duration</FieldLabel>
                  <Select
                    disabled={banUser.isPending}
                    onValueChange={field.onChange}
                    value={field.value}
                  >
                    <SelectTrigger id={field.name}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="day">24 hours</SelectItem>
                      <SelectItem value="week">7 days</SelectItem>
                      <SelectItem value="month">30 days</SelectItem>
                      <SelectItem value="permanent">Permanent</SelectItem>
                    </SelectContent>
                  </Select>
                  {fieldState.invalid ? <FieldError errors={[fieldState.error]} /> : null}
                </Field>
              )}
            />
          </FieldGroup>
          <SubmitButton className="w-full" isSubmitting={banUser.isPending} type="submit">
            Ban account
          </SubmitButton>
        </form>
      </DialogContent>
    </Dialog>
  );
}
