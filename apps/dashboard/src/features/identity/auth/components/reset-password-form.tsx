"use client";

import { passwordSchema } from "@basango/domain/models";
import { Alert, AlertDescription, AlertTitle } from "@basango/ui/components/alert";
import { buttonVariants } from "@basango/ui/components/button";
import { Field, FieldError, FieldGroup, FieldLabel } from "@basango/ui/components/field";
import { Input } from "@basango/ui/components/input";
import { SubmitButton } from "@basango/ui/components/submit-button";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { CheckCircle2Icon, CircleAlertIcon } from "lucide-react";
import { Controller } from "react-hook-form";
import { toast } from "sonner";
import z from "zod";

import { authClient } from "#dashboard/app/auth/auth-client";
import { useZodForm } from "#dashboard/app/hooks/use-zod-form";

import { AuthPanel } from "./auth-page-layout";

const resetPasswordFormSchema = z
  .object({
    confirmPassword: passwordSchema,
    password: passwordSchema,
  })
  .refine((values) => values.password === values.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type ResetPasswordFormProps = {
  token?: string;
};

export function ResetPasswordForm({ token }: ResetPasswordFormProps) {
  const queryClient = useQueryClient();
  const form = useZodForm(resetPasswordFormSchema, {
    defaultValues: { confirmPassword: "", password: "" },
  });

  const mutation = useMutation({
    mutationFn: async ({ password, token }: { password: string; token: string }) => {
      const result = await authClient.resetPassword({ newPassword: password, token });
      if (result.error) {
        throw new Error(result.error.message ?? "Unable to reset your password.");
      }
      return result.data;
    },
    onError(error) {
      toast.error(error.message ?? "Unable to reset your password. Try again.");
    },
    onSuccess() {
      return queryClient.invalidateQueries();
    },
  });

  if (!token) {
    return (
      <AuthPanel
        description="This link is incomplete or no longer valid."
        title="Invalid reset link"
      >
        <Alert variant="destructive">
          <CircleAlertIcon />
          <AlertTitle>Request a new link</AlertTitle>
          <AlertDescription>
            Password reset links expire after 30 minutes and can only be used once.
          </AlertDescription>
        </Alert>
        <Link className={buttonVariants({ className: "min-h-11 w-full" })} to="/forgot-password">
          Request a new reset link
        </Link>
      </AuthPanel>
    );
  }

  if (mutation.isSuccess) {
    return (
      <AuthPanel description="Your new password is ready to use." title="Password reset">
        <Alert>
          <CheckCircle2Icon />
          <AlertTitle>All done</AlertTitle>
          <AlertDescription>
            For your security, existing Basango sessions have been signed out.
          </AlertDescription>
        </Alert>
        <Link className={buttonVariants({ className: "min-h-11 w-full" })} to="/login">
          Log in with your new password
        </Link>
      </AuthPanel>
    );
  }

  return (
    <AuthPanel
      description="Use at least 8 characters. Your reset link can only be used once."
      title="Choose a new password"
    >
      <form
        onSubmit={form.handleSubmit((values) =>
          mutation.mutate({ password: values.password, token }),
        )}
      >
        <FieldGroup>
          <Controller
            control={form.control}
            name="password"
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor={field.name}>New password</FieldLabel>
                <Input
                  {...field}
                  aria-invalid={fieldState.invalid}
                  autoComplete="new-password"
                  autoFocus
                  className="h-11 px-3"
                  disabled={mutation.isPending}
                  id={field.name}
                  type="password"
                />
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />

          <Controller
            control={form.control}
            name="confirmPassword"
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor={field.name}>Confirm new password</FieldLabel>
                <Input
                  {...field}
                  aria-invalid={fieldState.invalid}
                  autoComplete="new-password"
                  className="h-11 px-3"
                  disabled={mutation.isPending}
                  id={field.name}
                  type="password"
                />
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />

          <SubmitButton
            className="min-h-11 w-full px-4"
            isSubmitting={mutation.isPending}
            type="submit"
          >
            Reset password
          </SubmitButton>
        </FieldGroup>
      </form>
    </AuthPanel>
  );
}
