"use client";

import { loginSchema } from "@basango/domain/models";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@basango/ui/components/field";
import { Input } from "@basango/ui/components/input";
import { SubmitButton } from "@basango/ui/components/submit-button";
import { cn } from "@basango/ui/lib/utils";
import { useMutation } from "@tanstack/react-query";
import { useNavigate, useRouter } from "@tanstack/react-router";
import { Controller } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { useZodForm } from "#dashboard/hooks/use-zod-form";
import { useUserStore } from "#dashboard/stores/user-store";
import { useTRPC } from "#dashboard/trpc/client";
import { persistSessionTokens } from "#dashboard/utils/auth/client";

type LoginValues = z.infer<typeof loginSchema>;

type LoginFormProps = React.ComponentProps<"form"> & {
  returnTo?: string;
};

export function LoginForm({ className, returnTo, ...props }: LoginFormProps) {
  const router = useRouter();
  const navigate = useNavigate();
  const trpc = useTRPC();
  const setUser = useUserStore((state) => state.setUser);

  const form = useZodForm(loginSchema, {
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const mutation = useMutation(
    trpc.auth.login.mutationOptions({
      onError(error) {
        toast.error(error.message ?? "Unable to login. Try again.");
      },
      async onSuccess(data) {
        persistSessionTokens({
          accessToken: data.accessToken,
          accessTokenExpiresAt: data.accessTokenExpiresAt,
          refreshToken: data.refreshToken,
          refreshTokenExpiresAt: data.refreshTokenExpiresAt,
        });
        setUser(data.user);
        toast.success("Successfully logged in.");

        form.reset();
        await navigate({ to: returnTo ?? "/dashboard" });
        await router.invalidate();
      },
    }),
  );

  const handleSubmit = (values: LoginValues) => mutation.mutate(values);

  return (
    <form
      className={cn("flex flex-col gap-6", className)}
      onSubmit={form.handleSubmit(handleSubmit)}
      {...props}
    >
      <FieldGroup>
        <div className="flex flex-col items-center gap-1 text-center">
          <h1 className="text-2xl font-bold">Basango Dashboard</h1>
          <p className="text-muted-foreground text-sm text-balance">
            Enter your email below to login to your account
          </p>
        </div>

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
                <a className="ml-auto text-sm underline-offset-4 hover:underline" href="#">
                  Forgot your password?
                </a>
              </div>
              <Input
                {...field}
                aria-invalid={fieldState.invalid}
                autoComplete="current-password"
                disabled={mutation.isPending}
                id={field.name}
                type="password"
              />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        <SubmitButton className="w-full" isSubmitting={mutation.isPending} type="submit">
          Login
        </SubmitButton>

        <Field>
          <FieldDescription className="text-center">
            Don&apos;t have an account?{" "}
            <a className="underline underline-offset-4" href="#">
              Sign up
            </a>
          </FieldDescription>
        </Field>
      </FieldGroup>
    </form>
  );
}
