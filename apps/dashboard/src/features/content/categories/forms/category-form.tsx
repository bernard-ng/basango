"use client";

import type { RouterOutputs } from "@basango/api/trpc/routers/_app";
import { updateCategorySchema } from "@basango/domain/models";
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
import { Controller } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { useZodForm } from "#dashboard/app/hooks/use-zod-form";
import { useTRPC } from "#dashboard/app/trpc/client";

const categoryFieldsSchema = updateCategorySchema.omit({ id: true });

const categoryFormSchema = z.object({
  candidates: z.string().trim().min(1, "Add at least one candidate label."),
  description: z
    .string()
    .optional()
    .transform((value) => value?.trim() || undefined)
    .pipe(categoryFieldsSchema.shape.description),
  name: z.string().trim().pipe(categoryFieldsSchema.shape.name),
  slug: z.string().trim().pipe(categoryFieldsSchema.shape.slug),
  weight: categoryFieldsSchema.shape.weight,
});

type CategoryFormValues = z.infer<typeof categoryFormSchema>;
type ManagedCategory = RouterOutputs["categories"]["list"][number];

type CategoryFormProps = {
  category?: ManagedCategory;
  onSuccess: () => void;
};

export function CategoryForm({ category, onSuccess }: CategoryFormProps) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const form = useZodForm(categoryFormSchema, {
    defaultValues: {
      candidates: category?.candidates.join(", ") ?? "",
      description: category?.description ?? "",
      name: category?.name ?? "",
      slug: category?.slug ?? "",
      weight: category?.weight ?? 1,
    },
  });

  function refreshCategories() {
    void queryClient.invalidateQueries({ queryKey: trpc.categories.list.queryKey() });
    void queryClient.invalidateQueries({ queryKey: trpc.categories.stats.queryKey() });
    void queryClient.invalidateQueries({ queryKey: trpc.articles.list.queryKey() });
  }

  const createCategory = useMutation(
    trpc.categories.create.mutationOptions({
      onError(error) {
        toast.error(error.message || "Unable to create category.");
      },
      onSuccess() {
        toast.success("Category created. Existing articles are queued for clustering.");
        refreshCategories();
        onSuccess();
      },
    }),
  );
  const updateCategory = useMutation(
    trpc.categories.update.mutationOptions({
      onError(error) {
        toast.error(error.message || "Unable to update category.");
      },
      onSuccess() {
        toast.success("Category updated.");
        refreshCategories();
        onSuccess();
      },
    }),
  );
  const isPending = createCategory.isPending || updateCategory.isPending;

  function handleSubmit(values: CategoryFormValues) {
    const candidates = values.candidates
      .split(/[\n,]/)
      .map((candidate) => candidate.trim())
      .filter(Boolean);

    if (category) {
      updateCategory.mutate({ ...values, candidates, id: category.id });
      return;
    }

    createCategory.mutate({ ...values, candidates });
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
                disabled={isPending}
                id={field.name}
              />
              {fieldState.invalid ? <FieldError errors={[fieldState.error]} /> : null}
            </Field>
          )}
        />

        <div className="grid gap-4 sm:grid-cols-[1fr_8rem]">
          <Controller
            control={form.control}
            name="slug"
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor={field.name}>Slug</FieldLabel>
                <Input
                  {...field}
                  aria-invalid={fieldState.invalid}
                  disabled={isPending}
                  id={field.name}
                  placeholder="politique-gouvernement"
                />
                {fieldState.invalid ? <FieldError errors={[fieldState.error]} /> : null}
              </Field>
            )}
          />
          <Controller
            control={form.control}
            name="weight"
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor={field.name}>Weight</FieldLabel>
                <Input
                  aria-invalid={fieldState.invalid}
                  disabled={isPending}
                  id={field.name}
                  max={100}
                  min={0}
                  name={field.name}
                  onBlur={field.onBlur}
                  onChange={(event) => field.onChange(Number(event.target.value))}
                  ref={field.ref}
                  type="number"
                  value={field.value}
                />
                {fieldState.invalid ? <FieldError errors={[fieldState.error]} /> : null}
              </Field>
            )}
          />
        </div>

        <Controller
          control={form.control}
          name="candidates"
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor={field.name}>Candidate labels</FieldLabel>
              <Textarea
                {...field}
                aria-invalid={fieldState.invalid}
                disabled={isPending}
                id={field.name}
                placeholder="politique, élections, parlement"
                rows={5}
              />
              <FieldDescription>
                Separate labels with commas or new lines. They are matched without accents or case.
              </FieldDescription>
              {fieldState.invalid ? <FieldError errors={[fieldState.error]} /> : null}
            </Field>
          )}
        />

        <Controller
          control={form.control}
          name="description"
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor={field.name}>Description</FieldLabel>
              <Textarea {...field} disabled={isPending} id={field.name} rows={3} />
              {fieldState.invalid ? <FieldError errors={[fieldState.error]} /> : null}
            </Field>
          )}
        />
      </FieldGroup>

      <SubmitButton className="w-full" isSubmitting={isPending} type="submit">
        {category ? "Save category" : "Create category"}
      </SubmitButton>
    </form>
  );
}
