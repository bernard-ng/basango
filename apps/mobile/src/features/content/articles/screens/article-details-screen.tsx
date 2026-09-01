import { useQuery } from "@tanstack/react-query";
import { Image } from "expo-image";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { Linking, Share } from "react-native";
import { H5, ScrollView, Separator, XStack, YStack } from "tamagui";

import { useTRPC } from "#mobile/application/trpc/client";
import { SourceReference } from "#mobile/features/content/articles/components/source-reference";
import { useArticleBookmarks } from "#mobile/features/content/bookmarks/hooks/use-article-bookmarks";
import { formatPublicationDate } from "#mobile/features/content/shared/format-publication-date";
import { toPlainText } from "#mobile/features/content/shared/to-plain-text";
import { Screen } from "#mobile/ui/components/screen";
import { ErrorState, LoadingState } from "#mobile/ui/components/status-state";
import { Text } from "#mobile/ui/components/text";
import { screenBottomPadding, screenGutter } from "#mobile/ui/layout";

export function ArticleDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const trpc = useTRPC();
  const article = useQuery(trpc.public.articles.get.queryOptions({ id }));
  const articleBookmarks = useArticleBookmarks(id);

  async function handleShare() {
    if (!article.data) {
      return;
    }

    await Share.share({
      message: `${article.data.title}\n${article.data.link}`,
      title: article.data.title,
      url: article.data.link,
    });
  }

  if (article.isPending) {
    return (
      <Screen hasNativeHeader>
        <LoadingState label="Chargement de l’article…" />
      </Screen>
    );
  }

  if (article.isError) {
    return (
      <Screen hasNativeHeader>
        <ErrorState onRetry={() => void article.refetch()} />
      </Screen>
    );
  }

  return (
    <Screen hasNativeHeader>
      <Stack.Toolbar placement="right">
        <Stack.Toolbar.Button
          accessibilityLabel={
            articleBookmarks.isBookmarked ? "Gérer les signets" : "Ajouter aux signets"
          }
          icon={articleBookmarks.isBookmarked ? "bookmark.fill" : "bookmark"}
          onPress={() =>
            router.push({
              params: { articleId: article.data.id },
              pathname: "/(app)/(tabs)/articles/bookmark-picker",
            })
          }
        />
        <Stack.Toolbar.Button
          accessibilityLabel="Partager l’article"
          icon="square.and.arrow.up"
          onPress={handleShare}
        />
        <Stack.Toolbar.Menu accessibilityLabel="Actions de l’article" icon="ellipsis">
          <Stack.Toolbar.MenuAction
            icon="bubble.left"
            onPress={() =>
              router.push({
                params: { articleId: article.data.id },
                pathname: "/(app)/(tabs)/articles/comments",
              })
            }
          >
            Commentaires
          </Stack.Toolbar.MenuAction>
          <Stack.Toolbar.MenuAction
            icon="safari"
            onPress={() => void Linking.openURL(article.data.link)}
          >
            Ouvrir sur le site
          </Stack.Toolbar.MenuAction>
        </Stack.Toolbar.Menu>
      </Stack.Toolbar>

      <ScrollView
        contentContainerStyle={{
          paddingBottom: screenBottomPadding,
          paddingHorizontal: screenGutter,
        }}
        contentInsetAdjustmentBehavior="automatic"
        showsVerticalScrollIndicator={false}
      >
        {article.data.image ? (
          <YStack borderRadius="$4" marginBottom="$4" overflow="hidden">
            <Image
              contentFit="cover"
              source={{ uri: article.data.image }}
              style={{ height: 225, width: "100%" }}
              transition={180}
            />
          </YStack>
        ) : null}

        <YStack backgroundColor="$background" gap="$4">
          {article.data.category ? (
            <XStack flexWrap="wrap" gap="$2">
              <Text variant="caption">{article.data.category.name.toLocaleLowerCase("fr-CD")}</Text>
            </XStack>
          ) : null}

          <H5 fontWeight="bold" marginBottom="$1">
            {toPlainText(article.data.title)}
          </H5>

          <YStack gap="$2">
            <SourceReference source={article.data.source} />
            <XStack alignItems="center" height={20}>
              <Text variant="caption">{formatPublicationDate(article.data.publishedAt)}</Text>
              {article.data.readingTime ? (
                <>
                  <Separator alignSelf="stretch" marginHorizontal={16} vertical />
                  <Text variant="caption">{article.data.readingTime} minutes de lecture</Text>
                </>
              ) : null}
            </XStack>
          </YStack>

          <Text fontSize={16} lineHeight={25} marginTop="$2">
            {toPlainText(article.data.body)}
          </Text>
        </YStack>
      </ScrollView>
    </Screen>
  );
}
