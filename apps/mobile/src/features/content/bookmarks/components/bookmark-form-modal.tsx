import { createBookmarkSchema } from "@basango/domain/models";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { ScrollView, XStack, YStack } from "tamagui";
import type z from "zod";

import { useTRPC } from "#mobile/application/trpc/client";
import type { Bookmark } from "#mobile/features/content/types";
import { BottomSheetModal } from "#mobile/ui/components/bottom-sheet-modal";
import { Button } from "#mobile/ui/components/button";
import { Input } from "#mobile/ui/components/input";
import { Switch } from "#mobile/ui/components/switch";
import { Text } from "#mobile/ui/components/text";

const bookmarkFormSchema = createBookmarkSchema;

type BookmarkForm = z.input<typeof bookmarkFormSchema>;

type BookmarkFormModalProps = {
  bookmark?: Bookmark;
  onClose: () => void;
  visible: boolean;
};

export function BookmarkFormModal({ bookmark, onClose, visible }: BookmarkFormModalProps) {
  const queryClient = useQueryClient();
  const trpc = useTRPC();
  const form = useForm<BookmarkForm>({
    defaultValues: { description: "", isPublic: false, name: "" },
    mode: "onChange",
    resolver: zodResolver(bookmarkFormSchema),
  });
  const createBookmark = useMutation(
    trpc.feed.bookmarks.create.mutationOptions({
      onError(error) {
        form.setError("root", { message: error.message || "Impossible de créer ce signet." });
      },
      onSuccess() {
        void queryClient.invalidateQueries(trpc.feed.bookmarks.list.queryFilter());
        form.reset();
        onClose();
      },
    }),
  );
  const updateBookmark = useMutation(
    trpc.feed.bookmarks.update.mutationOptions({
      onError(error) {
        form.setError("root", { message: error.message || "Impossible de modifier ce signet." });
      },
      onSuccess() {
        void queryClient.invalidateQueries(trpc.feed.bookmarks.list.queryFilter());
        form.reset();
        onClose();
      },
    }),
  );

  useEffect(() => {
    if (!visible) {
      return;
    }

    form.reset({
      description: bookmark?.description ?? "",
      isPublic: bookmark?.isPublic ?? false,
      name: bookmark?.name ?? "",
    });
  }, [bookmark, form, visible]);

  function handleSubmit(values: BookmarkForm) {
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

  return (
    <BottomSheetModal
      onClose={onClose}
      title={bookmark ? "Modifier le signet" : "Nouveau signet"}
      visible={visible}
    >
      <ScrollView
        contentContainerStyle={{ gap: 20, paddingBottom: 24, paddingHorizontal: 20 }}
        keyboardShouldPersistTaps="handled"
      >
        <Text variant="caption">
          {bookmark
            ? "Mettez à jour le nom et la visibilité de cette collection."
            : "Créez une collection pour retrouver facilement vos articles."}
        </Text>

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

        <Button
          disabled={!form.formState.isValid}
          isLoading={createBookmark.isPending || updateBookmark.isPending}
          onPress={form.handleSubmit(handleSubmit)}
        >
          {bookmark ? "Enregistrer" : "Créer le signet"}
        </Button>
      </ScrollView>
    </BottomSheetModal>
  );
}
