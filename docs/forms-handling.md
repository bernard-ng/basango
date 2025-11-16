# Forms, Modals & Mutations

This document explains how to implement interactive forms within the Basango dashboard. The process covers schema validation, React Hook Form (RHF) integration, using shadcn UI fields, wiring tRPC mutations, handling toasts, and controlling dialogs via Nuqs query parameters.

## 1. Define a Zod Schema

Describe the form shape locally using Zod. Example (`SourceForm`):

```ts
const sourceFormSchema = z.object({
  description: z.string().optional().transform((value) => {
    const trimmed = value?.trim();
    return trimmed ? trimmed : undefined;
  }),
  displayName: z
    .string()
    .optional()
    .transform((value) => {
      const trimmed = value?.trim();
      return trimmed ? trimmed : undefined;
    }),
  name: z.string().trim().min(1, "Name is required").max(255),
  url: z.string().trim().url("Enter a valid URL").max(255),
});
```

## 2. Initialize RHF with `useZodForm`

Use the shared hook `useZodForm` to connect Zod to RHF:

```ts
const form = useZodForm(sourceFormSchema, {
  defaultValues: {
    description: "",
    displayName: "",
    name: "",
    url: "",
  },
});
```

## 3. Build Inputs with `<Controller />` & `<Field />`

Wrap each input using `Controller` so that we can access `field` and `fieldState`. Compose UI using shadcn Field primitives and Basango inputs:

```tsx
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
      <FieldDescription>This should match the unique identifier.</FieldDescription>
      {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
    </Field>
  )}
/>
```

Repeat for other controls (`Input`, `Textarea`, `Select`, etc.). Always pass `aria-invalid` and show `<FieldError />` when needed.

## 4. Submit with `SubmitButton`

Use the shared `SubmitButton` to get the loading indicator:

```tsx
<SubmitButton className="w-full" isSubmitting={mutation.isPending} type="submit">
  Create source
</SubmitButton>
```

## 5. Wire the tRPC Mutation

Create the mutation via `useTRPC()`:

```ts
const trpc = useTRPC();
const queryClient = useQueryClient();

const mutation = useMutation(
  trpc.sources.create.mutationOptions({
    onError(error) {
      toast.error(error.message ?? "Unable to create source.");
    },
    onSuccess() {
      toast.success("Source created successfully.");
      queryClient.invalidateQueries({
        queryKey: trpc.sources.get.queryKey(),
      });
      form.reset();
      onSuccess?.();
    },
  }),
);
```

In `handleSubmit`, call `mutation.mutate(values)`.

## 6. Control Modals via Nuqs Query State

Dialogs that need to be opened from multiple places leverage Nuqs for query-parameter-driven state:

```ts
// apps/dashboard/src/hooks/use-source-params.ts
import { parseAsBoolean, useQueryStates } from "nuqs";

export function useSourceParams() {
  const [params, setParams] = useQueryStates({
    createSource: parseAsBoolean,
  });

  return { ...params, setParams };
}
```

### Dialog Implementation

```tsx
export function SourceCreateDialog() {
  const { createSource, setParams } = useSourceParams();
  const isOpen = Boolean(createSource);

  const openDialog = () => setParams({ createSource: true });
  const closeDialog = () => setParams(null);

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => (open ? openDialog() : closeDialog())}
    >
      <Button onClick={openDialog} type="button">
        <PlusIcon className="mr-2 size-4" />
        Add source
      </Button>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create a new source</DialogTitle>
          <DialogDescription>Add a news outlet to track.</DialogDescription>
        </DialogHeader>
        <SourceForm onSuccess={closeDialog} />
      </DialogContent>
    </Dialog>
  );
}
```

Because the dialog state lives in the query string, any server-rendered page or client button can open it by linking to `?createSource=true`.

## 7. Page Integration

Include the dialog trigger where needed, e.g. `apps/dashboard/src/app/[locale]/(app)/(sidebar)/sources/page.tsx`:

```tsx
<div className="mb-6 flex justify-end">
  <SourceCreateDialog />
</div>
```

## 8. Toast Feedback

Use Sonner to provide async feedback within mutation callbacks (`toast.success`, `toast.error`). The Toaster is already mounted in the root layout.

## 9. Recap Checklist

1. Define a Zod schema and create an RHF form via `useZodForm`.
2. Use `Controller` + shadcn `Field` primitives for each input.
3. Use `SubmitButton` for consistent loading states.
4. Wire `useTRPC().<namespace>.<mutation>.useMutation()` with toast callbacks and query invalidation.
5. Drive modal state via Nuqs `useQueryStates` hook so links/buttons can open the modal anywhere.
6. Reset the form after successful submission.

Following this pattern ensures forms, modals, and mutations behave consistently across the dashboard.
