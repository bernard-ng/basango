import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { Trash2Icon } from "lucide-react-native";
import { Alert, FlatList } from "react-native";
import { Button as TamaguiButton, YStack } from "tamagui";

import { useTRPC } from "#mobile/application/trpc/client";
import { ArticleCard } from "#mobile/features/content/articles/components/article-card";
import { ArticleListFooter } from "#mobile/features/content/articles/components/article-list-footer";
import { useInfiniteBookmarkArticles } from "#mobile/features/content/bookmarks/hooks/use-infinite-bookmark-articles";
import { Screen } from "#mobile/ui/components/screen";
import { EmptyState, ErrorState, LoadingState } from "#mobile/ui/components/status-state";
import { Text } from "#mobile/ui/components/text";
import { screenBottomPadding, screenGutter } from "#mobile/ui/layout";
import { useAppColors } from "#mobile/ui/theme";

export function BookmarkDetailsScreen() {
  const colors = useAppColors();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const queryClient = useQueryClient();
  const trpc = useTRPC();
  const bookmarks = useQuery(trpc.public.bookmarks.list.queryOptions({ limit: 100, page: 1 }));
  const articles = useInfiniteBookmarkArticles(id);
  const deleteBookmark = useMutation(
    trpc.public.bookmarks.delete.mutationOptions({
      onSuccess() {
        void queryClient.invalidateQueries(trpc.public.bookmarks.list.queryFilter());
        router.back();
      },
    }),
  );
  const removeArticle = useMutation(
    trpc.public.bookmarks.removeArticle.mutationOptions({
      onSuccess() {
        void articles.refetch();
        void queryClient.invalidateQueries(trpc.public.bookmarks.list.queryFilter());
      },
    }),
  );
  const bookmark = bookmarks.data?.items.find((item) => item.id === id);

  function handleDeleteBookmark() {
    Alert.alert("Supprimer ce signet ?", "La collection sera supprimée, pas ses articles.", [
      { style: "cancel", text: "Annuler" },
      {
        onPress: () => deleteBookmark.mutate({ id }),
        style: "destructive",
        text: "Supprimer",
      },
    ]);
  }

  function handleRemoveArticle(articleId: string) {
    Alert.alert("Retirer l’article ?", "Il ne figurera plus dans cette collection.", [
      { style: "cancel", text: "Annuler" },
      {
        onPress: () => removeArticle.mutate({ articleId, bookmarkId: id }),
        style: "destructive",
        text: "Retirer",
      },
    ]);
  }

  if (bookmarks.isPending || articles.isPending) {
    return (
      <Screen backgroundColor="$groupedBackground" hasNativeHeader>
        <LoadingState label="Chargement du signet…" />
      </Screen>
    );
  }

  if (bookmarks.isError || (articles.isError && articles.articles.length === 0) || !bookmark) {
    return (
      <Screen backgroundColor="$groupedBackground" hasNativeHeader>
        <ErrorState onRetry={() => void Promise.all([bookmarks.refetch(), articles.refetch()])} />
      </Screen>
    );
  }

  return (
    <Screen backgroundColor="$groupedBackground" hasNativeHeader>
      <Stack.Title style={{ color: colors.foreground }}>{bookmark.name}</Stack.Title>
      <Stack.Toolbar placement="right">
        <Stack.Toolbar.Menu accessibilityLabel="Actions du signet" icon="ellipsis">
          <Stack.Toolbar.MenuAction
            icon="pencil"
            onPress={() =>
              router.push({
                params: { bookmarkId: bookmark.id },
                pathname: "/(app)/(tabs)/bookmarks/form",
              })
            }
          >
            Modifier
          </Stack.Toolbar.MenuAction>
          <Stack.Toolbar.MenuAction
            destructive
            disabled={deleteBookmark.isPending}
            icon="trash"
            onPress={handleDeleteBookmark}
          >
            Supprimer
          </Stack.Toolbar.MenuAction>
        </Stack.Toolbar.Menu>
      </Stack.Toolbar>
      <FlatList
        contentContainerStyle={{
          paddingBottom: screenBottomPadding,
          paddingHorizontal: screenGutter,
        }}
        contentInsetAdjustmentBehavior="automatic"
        data={articles.articles}
        ItemSeparatorComponent={() => <YStack height="$2" />}
        keyExtractor={(article) => article.id}
        ListEmptyComponent={
          <EmptyState
            description="Ouvrez un article et touchez l’icône de signet pour l’ajouter ici."
            title="Collection vide"
          />
        }
        ListFooterComponent={
          <ArticleListFooter
            hasError={articles.isFetchNextPageError}
            isLoading={articles.isFetchingNextPage}
            onRetry={articles.loadNextPage}
          />
        }
        ListHeaderComponent={
          <YStack gap="$2" marginBottom="$4">
            {bookmark.description ? <Text variant="caption">{bookmark.description}</Text> : null}
            <Text color="$primary" variant="caption">
              {bookmark.articlesCount} articles · {bookmark.isPublic ? "Public" : "Privé"}
            </Text>
          </YStack>
        }
        onEndReached={articles.loadNextPage}
        onEndReachedThreshold={0.6}
        renderItem={({ item }) => (
          <YStack gap="$1">
            <ArticleCard article={item} />
            <TamaguiButton
              alignSelf="flex-end"
              backgroundColor="transparent"
              borderWidth={0}
              height={34}
              icon={<Trash2Icon color={colors.muted} size={15} strokeWidth={1.8} />}
              marginBottom="$3"
              onPress={() => handleRemoveArticle(item.id)}
              paddingHorizontal="$1"
              pressStyle={{ opacity: 0.7 }}
            >
              Retirer
            </TamaguiButton>
          </YStack>
        )}
        showsVerticalScrollIndicator={false}
        style={{ backgroundColor: colors.groupedBackground, flex: 1 }}
      />
    </Screen>
  );
}
