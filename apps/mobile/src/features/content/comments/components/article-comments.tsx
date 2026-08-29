import { createCommentSchema } from "@basango/domain/models";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Trash2Icon } from "lucide-react-native";
import { Controller } from "react-hook-form";
import { Alert, KeyboardAvoidingView } from "react-native";
import { ScrollView, Separator, XStack, YStack } from "tamagui";

import { authClient } from "#mobile/application/auth/auth-client";
import { useZodForm } from "#mobile/application/hooks/use-zod-form";
import { useTRPC } from "#mobile/application/trpc/client";
import { formatRelativeTime } from "#mobile/features/content/shared/format-relative-time";
import { Button } from "#mobile/ui/components/button";
import { IconButton } from "#mobile/ui/components/icon-button";
import { Input } from "#mobile/ui/components/input";
import { SourceAvatar } from "#mobile/ui/components/source-avatar";
import { ErrorState, LoadingState } from "#mobile/ui/components/status-state";
import { Text } from "#mobile/ui/components/text";
import { useAppColors } from "#mobile/ui/theme";

const commentFormSchema = createCommentSchema.pick({ content: true });

type ArticleCommentsProps = {
  articleId: string;
  enabled: boolean;
};

export function ArticleComments({ articleId, enabled }: ArticleCommentsProps) {
  const colors = useAppColors();
  const session = authClient.useSession();
  const queryClient = useQueryClient();
  const trpc = useTRPC();
  const comments = useQuery({
    ...trpc.feed.comments.list.queryOptions({ articleId, limit: 50, page: 1 }),
    enabled,
  });
  const form = useZodForm(commentFormSchema, {
    defaultValues: { content: "" },
    mode: "onChange",
  });
  const createComment = useMutation(
    trpc.feed.comments.create.mutationOptions({
      onError(error) {
        form.setError("root", {
          message: error.message || "Impossible de publier ce commentaire.",
        });
      },
      onSuccess() {
        void queryClient.invalidateQueries(trpc.feed.comments.list.queryFilter({ articleId }));
        form.reset();
      },
    }),
  );
  const deleteComment = useMutation(
    trpc.feed.comments.delete.mutationOptions({
      onSuccess() {
        void queryClient.invalidateQueries(trpc.feed.comments.list.queryFilter({ articleId }));
      },
    }),
  );

  function handleDelete(id: string) {
    Alert.alert("Supprimer le commentaire ?", "Cette action est définitive.", [
      { style: "cancel", text: "Annuler" },
      { onPress: () => deleteComment.mutate({ id }), style: "destructive", text: "Supprimer" },
    ]);
  }

  return (
    <KeyboardAvoidingView behavior="padding" collapsable={false} style={{ flex: 1 }}>
      <ScrollView
        contentContainerStyle={{ gap: 20, paddingBottom: 32, paddingHorizontal: 20 }}
        contentInsetAdjustmentBehavior="automatic"
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <YStack gap="$1">
          <Text variant="title">Participer à la discussion</Text>
          <Text variant="caption">
            {comments.data?.meta.total
              ? `${comments.data.meta.total} commentaire${comments.data.meta.total > 1 ? "s" : ""}`
              : "Soyez la première personne à réagir."}
          </Text>
        </YStack>

        <YStack gap="$3">
          <Controller
            control={form.control}
            name="content"
            render={({ field, fieldState }) => (
              <Input
                error={fieldState.error?.message}
                label="Votre commentaire"
                multiline
                onBlur={field.onBlur}
                onChangeText={field.onChange}
                placeholder="Partagez votre réaction…"
                value={field.value}
              />
            )}
          />
          {form.formState.errors.root?.message ? (
            <Text color="$danger" variant="caption">
              {form.formState.errors.root.message}
            </Text>
          ) : null}
          <Button
            disabled={!form.formState.isValid}
            isLoading={createComment.isPending}
            onPress={form.handleSubmit((values) => createComment.mutate({ articleId, ...values }))}
          >
            Publier
          </Button>
        </YStack>

        <Separator />

        {comments.isPending ? <LoadingState label="Chargement des commentaires…" /> : null}
        {comments.isError ? (
          <ErrorState
            description="Impossible de charger les commentaires."
            onRetry={() => void comments.refetch()}
          />
        ) : null}
        {comments.isSuccess && comments.data.items.length === 0 ? (
          <YStack alignItems="center" gap="$1" paddingVertical="$6">
            <Text variant="title">Aucun commentaire</Text>
            <Text textAlign="center" variant="caption">
              Lancez la conversation autour de cet article.
            </Text>
          </YStack>
        ) : null}

        <YStack gap="$5">
          {comments.data?.items.map((comment) => (
            <XStack gap="$3" key={comment.id}>
              <SourceAvatar name={comment.author.name} size="comment" />
              <YStack flex={1} gap="$1.5">
                <XStack alignItems="center" gap="$3" justifyContent="space-between">
                  <XStack alignItems="center" flex={1} gap="$2">
                    <Text fontWeight="600" numberOfLines={1} variant="caption">
                      {comment.author.name}
                    </Text>
                    <Text variant="caption">{formatRelativeTime(comment.createdAt)}</Text>
                  </XStack>
                  {comment.author.id === session.data?.user.id ? (
                    <IconButton
                      accessibilityLabel="Supprimer le commentaire"
                      height={32}
                      hitSlop={8}
                      onPress={() => handleDelete(comment.id)}
                      width={32}
                    >
                      <Trash2Icon color={colors.muted} size={16} strokeWidth={1.8} />
                    </IconButton>
                  ) : null}
                </XStack>
                <Text>{comment.content}</Text>
              </YStack>
            </XStack>
          ))}
        </YStack>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
