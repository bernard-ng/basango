"use client";

import type { RouterOutputs } from "@basango/api/trpc/routers/_app";
import { BIAS, RELIABILITY, TRANSPARENCY } from "@basango/domain/constants";
import { updateSourceSchema } from "@basango/domain/models";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@basango/ui/components/field";
import { Input } from "@basango/ui/components/input";
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
import { z } from "zod";

import { useZodForm } from "#dashboard/app/hooks/use-zod-form";
import { useTRPC } from "#dashboard/app/trpc/client";

const sourceEditSchema = z.object({
  credibility: updateSourceSchema.shape.credibility,
  description: z
    .string()
    .optional()
    .transform((value) => {
      const trimmed = value?.trim();
      return trimmed ? trimmed : undefined;
    })
    .pipe(updateSourceSchema.shape.description),
  displayName: z
    .string()
    .optional()
    .transform((value) => {
      const trimmed = value?.trim();
      return trimmed ? trimmed : undefined;
    })
    .pipe(updateSourceSchema.shape.displayName),
  id: updateSourceSchema.shape.id,
  name: z.string().trim().pipe(updateSourceSchema.shape.name),
  url: z.string().trim().pipe(updateSourceSchema.shape.url),
});

type SourceEditValues = z.infer<typeof sourceEditSchema>;

type SourceEditFormProps = {
  onSuccess?: () => void;
  source: RouterOutputs["sources"]["getById"];
};

export function SourceEditForm({ onSuccess, source }: SourceEditFormProps) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const form = useZodForm(sourceEditSchema, {
    defaultValues: {
      credibility: {
        bias: source.credibility?.bias ?? "neutral",
        reliability: source.credibility?.reliability ?? "average",
        transparency: source.credibility?.transparency ?? "medium",
      },
      description: source.description ?? "",
      displayName: source.displayName ?? "",
      id: source.id,
      name: source.name,
      url: source.url ?? "",
    },
    mode: "onChange",
  });

  const updateSource = useMutation(
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
        ]).then(() => onSuccess?.());
      },
    }),
  );

  function handleSubmit(values: SourceEditValues) {
    updateSource.mutate(values);
  }

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
                disabled={updateSource.isPending}
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
                disabled={updateSource.isPending}
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
          name="url"
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor={field.name}>Website URL</FieldLabel>
              <Input
                {...field}
                aria-invalid={fieldState.invalid}
                autoComplete="url"
                disabled={updateSource.isPending}
                id={field.name}
                placeholder="https://radiookapi.net"
                type="url"
              />
              <FieldDescription>The canonical website used for this source.</FieldDescription>
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
                disabled={updateSource.isPending}
                id={field.name}
                placeholder="Short summary about the source..."
                rows={4}
              />
              <FieldDescription>Optional summary shown across the product.</FieldDescription>
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        <div className="grid gap-4 sm:grid-cols-3">
          <Controller
            control={form.control}
            name="credibility.bias"
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel>Bias</FieldLabel>
                <Select
                  disabled={updateSource.isPending}
                  onValueChange={field.onChange}
                  value={field.value}
                >
                  <SelectTrigger aria-invalid={fieldState.invalid} className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {BIAS.map((value) => (
                      <SelectItem key={value} value={value}>
                        {formatOption(value)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />

          <Controller
            control={form.control}
            name="credibility.reliability"
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel>Reliability</FieldLabel>
                <Select
                  disabled={updateSource.isPending}
                  onValueChange={field.onChange}
                  value={field.value}
                >
                  <SelectTrigger aria-invalid={fieldState.invalid} className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {RELIABILITY.map((value) => (
                      <SelectItem key={value} value={value}>
                        {formatOption(value)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />

          <Controller
            control={form.control}
            name="credibility.transparency"
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel>Transparency</FieldLabel>
                <Select
                  disabled={updateSource.isPending}
                  onValueChange={field.onChange}
                  value={field.value}
                >
                  <SelectTrigger aria-invalid={fieldState.invalid} className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TRANSPARENCY.map((value) => (
                      <SelectItem key={value} value={value}>
                        {formatOption(value)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />
        </div>
      </FieldGroup>

      <SubmitButton className="w-full" isSubmitting={updateSource.isPending} type="submit">
        Save changes
      </SubmitButton>
    </form>
  );
}

function formatOption(value: string) {
  return value.replaceAll("_", " ");
}
