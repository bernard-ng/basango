"use client";

import type { RouterOutputs } from "@basango/api/trpc/routers/_app";
import { updateSourceSchema } from "@basango/domain/models/sources";
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
import { useCallback, useEffect } from "react";
import { Controller } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { useZodForm } from "#dashboard/hooks/use-zod-form";
import { useTRPC } from "#dashboard/trpc/client";

const baseSchema = updateSourceSchema.pick({
  description: true,
  displayName: true,
  id: true,
  name: true,
});

const sourceEditSchema = z.object({
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
  id: baseSchema.shape.id,
  name: z.string().trim().pipe(baseSchema.shape.name),
});

type SourceEditValues = z.infer<typeof sourceEditSchema>;

type Props = {
  source: RouterOutputs["sources"]["getById"];
};

export function SourceEditForm({ source }: Props) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const form = useZodForm(sourceEditSchema, {
    defaultValues: {
      description: source.description ?? "",
      displayName: source.displayName ?? "",
      id: source.id,
      name: source.name,
    },
    mode: "onChange",
  });

  useEffect(() => {
    form.reset({
      description: source.description ?? "",
      displayName: source.displayName ?? "",
      id: source.id,
      name: source.name,
    });
  }, [form, source.description, source.displayName, source.id, source.name]);

  const mutation = useMutation(
    trpc.sources.update.mutationOptions({
      onError(error) {
        toast.error(error.message ?? "Unable to update source.");
      },
      onSuccess() {
        toast.success("Source updated successfully.");
        void Promise.all([
          queryClient.invalidateQueries({
            queryKey: trpc.sources.list.queryKey(),
          }),
          queryClient.invalidateQueries({
            queryKey: trpc.sources.getById.queryKey({ id: source.id }),
          }),
        ]);
      },
    }),
  );

  const handleSubmit = useCallback(
    (values: SourceEditValues) => {
      mutation.mutate(values);
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
              <FieldDescription>Internal identifier of the source.</FieldDescription>
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
              <FieldDescription>Optional friendly label shown in the dashboard.</FieldDescription>
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
              <FieldDescription>Optional summary shown across the product.</FieldDescription>
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
      </FieldGroup>

      <SubmitButton className="w-full" isSubmitting={mutation.isPending} type="submit">
        Save changes
      </SubmitButton>
    </form>
  );
}
