import { createBookmarkSchema } from "@basango/domain/models";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Stack, useRouter } from "expo-router";
import { useEffect } from "react";
import { Controller } from "react-hook-form";
import { ScrollView, XStack, YStack } from "tamagui";
import type z from "zod";

import { useZodForm } from "#mobile/application/hooks/use-zod-form";
import { useTRPC } from "#mobile/application/trpc/client";
import type { Bookmark } from "#mobile/features/content/types";
import { Input } from "#mobile/ui/components/input";
import { Switch } from "#mobile/ui/components/switch";
import { Text } from "#mobile/ui/components/text";
import { useAppColors } from "#mobile/ui/theme";

const bookmarkFormSchema = createBookmarkSchema;

type BookmarkFormValues = z.input<typeof bookmarkFormSchema>;

type BookmarkFormProps = {
  bookmark?: Bookmark;
};

export function BookmarkForm({ bookmark }: BookmarkFormProps) {
  const colors = useAppColors();
  const queryClient = useQueryClient();
  const router = useRouter();
  const trpc = useTRPC();
  const form = useZodForm(bookmarkFormSchema, {
    defaultValues: { description: "", isPublic: false, name: "" },
    mode: "onChange",
  });

  function showError(error: unknown) {
    const fallback = bookmark
      ? "Impossible de modifier ce signet."
      : "Impossible de créer ce signet.";
    const message =
      typeof error === "object" &&
      error !== null &&
      "message" in error &&
      typeof error.message === "string"
        ? error.message
        : fallback;

    form.setError("root", { message });
  }

  function handleSuccess() {
    void queryClient.invalidateQueries(trpc.feed.bookmarks.list.queryFilter());
    router.back();
  }

  const createBookmark = useMutation(
    trpc.feed.bookmarks.create.mutationOptions({
      onError: showError,
      onSuccess: handleSuccess,
    }),
  );
  const updateBookmark = useMutation(
    trpc.feed.bookmarks.update.mutationOptions({
      onError: showError,
      onSuccess: handleSuccess,
    }),
  );

  useEffect(() => {
    form.reset({
      description: bookmark?.description ?? "",
      isPublic: bookmark?.isPublic ?? false,
      name: bookmark?.name ?? "",
    });
  }, [bookmark, form]);

  function handleSubmit(values: BookmarkFormValues) {
    const input = {
      description: values.description?.trim() || undefined,
      isPublic: values.isPublic ?? false,
      name: values.name,
    };

    if (bookmark) {
      updateBookmark.mutate({ id: bookmark.id, ...input });
      return;
    }

    createBookmark.mutate(input);
  }

  const isPending = createBookmark.isPending || updateBookmark.isPending;
  const title = bookmark ? "Modifier le signet" : "Nouveau signet";

  return (
    <>
      <Stack.Title style={{ color: colors.foreground }}>{title}</Stack.Title>
      <Stack.Toolbar placement="left">
        <Stack.Toolbar.Button
          accessibilityLabel="Fermer"
          icon="xmark"
          onPress={() => router.back()}
        />
      </Stack.Toolbar>
      <Stack.Toolbar placement="right">
        <Stack.Toolbar.Button
          disabled={!form.formState.isValid || isPending}
          onPress={form.handleSubmit(handleSubmit)}
          variant="done"
        >
          {bookmark ? "Enregistrer" : "Créer"}
        </Stack.Toolbar.Button>
      </Stack.Toolbar>

      <ScrollView
        backgroundColor="$groupedBackground"
        contentContainerStyle={{
          gap: 20,
          paddingBottom: 24,
          paddingHorizontal: 20,
          paddingTop: 20,
        }}
        contentInsetAdjustmentBehavior="automatic"
        keyboardShouldPersistTaps="handled"
      >
        <Controller
          control={form.control}
          name="name"
          render={({ field, fieldState }) => (
            <Input
              error={fieldState.error?.message}
              label="Nom"
              onBlur={field.onBlur}
              onChangeText={field.onChange}
              placeholder="À lire plus tard"
              value={field.value}
            />
          )}
        />
        <Controller
          control={form.control}
          name="description"
          render={({ field, fieldState }) => (
            <Input
              error={fieldState.error?.message}
              label="Description"
              multiline
              onBlur={field.onBlur}
              onChangeText={field.onChange}
              placeholder="Une note facultative"
              value={field.value}
            />
          )}
        />
        <Controller
          control={form.control}
          name="isPublic"
          render={({ field }) => (
            <XStack
              alignItems="center"
              backgroundColor="$card"
              borderColor="$borderColor"
              borderRadius="$4"
              borderWidth={1}
              gap="$4"
              justifyContent="space-between"
              minHeight={60}
              paddingHorizontal="$4"
              paddingVertical="$3"
            >
              <YStack flex={1} gap="$1">
                <Text variant="label">Collection publique</Text>
                <Text variant="caption">Prépare le partage de cette collection.</Text>
              </YStack>
              <Switch
                accessibilityLabel="Collection publique"
                checked={field.value ?? false}
                onCheckedChange={field.onChange}
              />
            </XStack>
          )}
        />

        {form.formState.errors.root?.message ? (
          <Text color="$danger" variant="caption">
            {form.formState.errors.root.message}
          </Text>
        ) : null}
      </ScrollView>
    </>
  );
}
