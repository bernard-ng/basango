"use client";

import { requestPasswordResetSchema } from "@basango/domain/models";
import { Alert, AlertDescription, AlertTitle } from "@basango/ui/components/alert";
import { Button, buttonVariants } from "@basango/ui/components/button";
import { Field, FieldError, FieldGroup, FieldLabel } from "@basango/ui/components/field";
import { Input } from "@basango/ui/components/input";
import { SubmitButton } from "@basango/ui/components/submit-button";
import { useMutation } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { CheckCircle2Icon } from "lucide-react";
import { useState } from "react";
import { Controller } from "react-hook-form";
import { toast } from "sonner";

import { authClient } from "#dashboard/app/auth/auth-client";
import { getUrl } from "#dashboard/app/environment";
import { useZodForm } from "#dashboard/app/hooks/use-zod-form";

import { AuthPanel } from "./auth-page-layout";

export function ForgotPasswordForm() {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const form = useZodForm(requestPasswordResetSchema, {
    defaultValues: { email: "" },
  });

  const mutation = useMutation({
    mutationFn: async ({ email }: { email: string }) => {
      const result = await authClient.requestPasswordReset({
        email,
        redirectTo: `${getUrl()}/reset-password`,
      });
      if (result.error) {
        throw new Error(result.error.message ?? "Unable to request a password reset.");
      }
      return result.data;
    },
    onError(error) {
      toast.error(error.message ?? "Unable to request a password reset. Try again.");
    },
    onSuccess() {
      setIsSubmitted(true);
    },
  });

  if (isSubmitted) {
    return (
      <AuthPanel
        description="If an account matches that address, we sent a password reset link."
        title="Check your email"
      >
        <Alert>
          <CheckCircle2Icon />
          <AlertTitle>Request received</AlertTitle>
          <AlertDescription>
            The link expires in 30 minutes. Check your spam folder if it does not arrive.
          </AlertDescription>
        </Alert>
        <Link className={buttonVariants({ className: "min-h-11 w-full" })} to="/login">
          Back to login
        </Link>
        <Button onClick={() => setIsSubmitted(false)} type="button" variant="ghost">
          Try another email
        </Button>
      </AuthPanel>
    );
  }

  return (
    <AuthPanel
      description="Enter your email and we will send you a secure reset link."
      title="Forgot your password?"
    >
      <form onSubmit={form.handleSubmit((values) => mutation.mutate(values))}>
        <FieldGroup>
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
                  autoFocus
                  className="h-11 px-3"
                  disabled={mutation.isPending}
                  id={field.name}
                  placeholder="m@example.com"
                  type="email"
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
            Send reset link
          </SubmitButton>

          <Link
            className={buttonVariants({ className: "min-h-11 w-full", variant: "ghost" })}
            to="/login"
          >
            Back to login
          </Link>
        </FieldGroup>
      </form>
    </AuthPanel>
  );
}
