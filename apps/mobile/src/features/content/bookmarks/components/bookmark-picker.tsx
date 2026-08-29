import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { BookmarkIcon, CheckIcon } from "lucide-react-native";
import { Alert } from "react-native";
import { ScrollView, XStack, YStack } from "tamagui";

import { useTRPC } from "#mobile/application/trpc/client";
import { EmptyState, LoadingState } from "#mobile/ui/components/status-state";
import { Text } from "#mobile/ui/components/text";
import { useAppColors } from "#mobile/ui/theme";

type BookmarkPickerProps = {
  articleId: string;
  onComplete: () => void;
};

export function BookmarkPicker({ articleId, onComplete }: BookmarkPickerProps) {
  const colors = useAppColors();
  const queryClient = useQueryClient();
  const trpc = useTRPC();
  const bookmarks = useQuery(trpc.feed.bookmarks.list.queryOptions({ limit: 100, page: 1 }));
  const addArticle = useMutation(
    trpc.feed.bookmarks.addArticle.mutationOptions({
      onError(error) {
        Alert.alert(
          "Ajout impossible",
          error.message || "Impossible d’ajouter cet article au signet.",
        );
      },
      onSuccess() {
        void queryClient.invalidateQueries(trpc.feed.bookmarks.list.queryFilter());
        void queryClient.invalidateQueries({
          queryKey: trpc.feed.bookmarks.listArticles.pathKey(),
        });
        onComplete();
      },
    }),
  );

  return (
    <ScrollView
      backgroundColor="$groupedBackground"
      contentContainerStyle={{ paddingBottom: 24, paddingHorizontal: 20, paddingTop: 12 }}
      contentInsetAdjustmentBehavior="automatic"
    >
      <YStack gap="$1" paddingBottom="$3" paddingHorizontal="$5">
        <Text variant="caption">Choisissez la collection qui recevra cet article.</Text>
      </YStack>
      {bookmarks.isPending ? <LoadingState /> : null}
      {bookmarks.data?.items.length === 0 ? (
        <EmptyState
          description="Créez d’abord un signet depuis l’onglet Signets."
          title="Aucun signet"
        />
      ) : null}
      {bookmarks.data?.items.map((bookmark) => (
        <XStack
          alignItems="center"
          borderBottomColor="$borderColor"
          borderBottomWidth={1}
          disabled={addArticle.isPending}
          gap="$3"
          key={bookmark.id}
          onPress={() => addArticle.mutate({ articleId, bookmarkId: bookmark.id })}
          paddingVertical="$4"
          pressStyle={{ opacity: 0.7 }}
        >
          <YStack
            alignItems="center"
            backgroundColor="$surface"
            borderRadius="$4"
            height={44}
            justifyContent="center"
            width={44}
          >
            <BookmarkIcon color={colors.primary} size={21} strokeWidth={1.8} />
          </YStack>
          <YStack flex={1} gap="$1">
            <Text variant="title">{bookmark.name}</Text>
            <Text variant="caption">{bookmark.articlesCount} articles</Text>
          </YStack>
          {addArticle.isPending && addArticle.variables?.bookmarkId === bookmark.id ? (
            <CheckIcon color={colors.primary} size={20} />
          ) : null}
        </XStack>
      ))}
    </ScrollView>
  );
}
