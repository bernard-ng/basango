"use client";

import { loginSchema } from "@basango/domain/models";
import { Field, FieldError, FieldGroup, FieldLabel } from "@basango/ui/components/field";
import { Input } from "@basango/ui/components/input";
import { SubmitButton } from "@basango/ui/components/submit-button";
import { cn } from "@basango/ui/lib/utils";
import { useMutation } from "@tanstack/react-query";
import { Link, useNavigate, useRouter } from "@tanstack/react-router";
import { Controller } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { authClient, hasAdminRole } from "#dashboard/app/auth/auth-client";
import { useZodForm } from "#dashboard/app/hooks/use-zod-form";

import { AuthPanel } from "./auth-page-layout";

type LoginValues = z.infer<typeof loginSchema>;

type LoginFormProps = React.ComponentProps<"form"> & {
  returnTo?: string;
};

export function LoginForm({ className, returnTo, ...props }: LoginFormProps) {
  const router = useRouter();
  const navigate = useNavigate();

  const form = useZodForm(loginSchema, {
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const mutation = useMutation({
    mutationFn: async (values: LoginValues) => {
      const result = await authClient.signIn.email(values);
      if (result.error) {
        throw new Error(result.error.message ?? "Invalid credentials.");
      }
      if (!result.data || !hasAdminRole(result.data.user.role)) {
        await authClient.signOut();
        throw new Error("This account does not have dashboard access.");
      }
      return result.data;
    },
    onError(error) {
      toast.error(error.message ?? "Unable to login. Try again.");
    },
    async onSuccess() {
      toast.success("Successfully logged in.");
      form.reset();
      const destination =
        returnTo?.startsWith("/") && !returnTo.startsWith("//") ? returnTo : "/dashboard";
      await navigate({ to: destination });
      await router.invalidate();
    },
  });

  const handleSubmit = (values: LoginValues) => mutation.mutate(values);

  return (
    <AuthPanel
      description="Enter your email below to log in to your account."
      title="Basango Dashboard"
    >
      <form
        className={cn("flex flex-col gap-6", className)}
        onSubmit={form.handleSubmit(handleSubmit)}
        {...props}
      >
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

          <Controller
            control={form.control}
            name="password"
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <div className="flex items-center">
                  <FieldLabel htmlFor={field.name}>Password</FieldLabel>
                  <Link
                    className="ml-auto text-sm underline-offset-4 hover:underline"
                    to="/forgot-password"
                  >
                    Forgot your password?
                  </Link>
                </div>
                <Input
                  {...field}
                  aria-invalid={fieldState.invalid}
                  autoComplete="current-password"
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
            Login
          </SubmitButton>
        </FieldGroup>
      </form>
    </AuthPanel>
  );
}
