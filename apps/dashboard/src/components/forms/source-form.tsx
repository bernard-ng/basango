"use client";

import { createSourceSchema } from "@basango/domain/models/sources";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@basango/ui/components/field";
import { Input } from "@basango/ui/components/input";
import { SubmitButton } from "@basango/ui/components/submit-button";
import { Textarea } from "@basango/ui/components/textarea";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import { Controller } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { useZodForm } from "#dashboard/hooks/use-zod-form";
import { useTRPC } from "#dashboard/trpc/client";

const baseSchema = createSourceSchema.pick({
  description: true,
  displayName: true,
  name: true,
  url: true,
});

const sourceFormSchema = z.object({
  description: z
    .string()
    .optional()
    .transform((value) => {
      const trimmed = value?.trim();
      return trimmed ? trimmed : undefined;
    })
    .pipe(baseSchema.shape.description),
  displayName: z
    .string()
    .optional()
    .transform((value) => {
      const trimmed = value?.trim();
      return trimmed ? trimmed : undefined;
    })
    .pipe(baseSchema.shape.displayName),
  name: z.string().trim().pipe(baseSchema.shape.name),
  url: z.string().trim().pipe(baseSchema.shape.url),
});

type SourceFormValues = z.infer<typeof sourceFormSchema>;

type SourceFormProps = {
  onSuccess?: () => void;
};

export function SourceForm({ onSuccess }: SourceFormProps) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const form = useZodForm(sourceFormSchema, {
    defaultValues: {
      description: "",
      displayName: "",
      name: "",
      url: "",
    },
  });

  const mutation = useMutation(
    trpc.sources.create.mutationOptions({
      onError(error) {
        toast.error(error.message ?? "Unable to create source.");
      },
      onSuccess() {
        toast.success("Source created successfully.");
        queryClient.invalidateQueries({
          queryKey: trpc.sources.list.queryKey(),
        });
        form.reset();
        onSuccess?.();
      },
    }),
  );

  const handleSubmit = useCallback(
    (values: SourceFormValues) => {
      mutation.mutate({
        ...values,
      });
    },
    [mutation],
  );

  return (
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
                autoComplete="off"
                disabled={mutation.isPending}
                id={field.name}
                placeholder="radiookapi.com"
              />
              <FieldDescription>
                This should match the unique identifier of the source.
              </FieldDescription>
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        <Controller
          control={form.control}
          name="displayName"
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor={field.name}>Display name</FieldLabel>
              <Input
                {...field}
                aria-invalid={fieldState.invalid}
                autoComplete="off"
                disabled={mutation.isPending}
                id={field.name}
                placeholder="Radio Okapi"
              />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        <Controller
          control={form.control}
          name="url"
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor={field.name}>Website URL</FieldLabel>
              <Input
                {...field}
                aria-invalid={fieldState.invalid}
                autoComplete="off"
                disabled={mutation.isPending}
                id={field.name}
                placeholder="https://techcrunch.com"
                type="url"
              />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        <Controller
          control={form.control}
          name="description"
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor={field.name}>Description</FieldLabel>
              <Textarea
                {...field}
                aria-invalid={fieldState.invalid}
                disabled={mutation.isPending}
                id={field.name}
                placeholder="Short summary about the source..."
                rows={4}
              />
              <FieldDescription>
                Optional brief description (up to 1024 characters).
              </FieldDescription>
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
      </FieldGroup>

      <SubmitButton className="w-full" isSubmitting={mutation.isPending} type="submit">
        Create source
      </SubmitButton>
    </form>
  );
}
