import { useQuery } from "@tanstack/react-query";
import { Image } from "expo-image";
import { Stack, useLocalSearchParams } from "expo-router";
import { BookmarkIcon, MessageCircleIcon, Share2Icon } from "lucide-react-native";
import { useState } from "react";
import { Linking, Share } from "react-native";
import { H5, ScrollView, Separator, XStack, YStack } from "tamagui";

import { useTRPC } from "#mobile/application/trpc/client";
import { SourceReference } from "#mobile/features/content/articles/components/source-reference";
import { BookmarkPickerModal } from "#mobile/features/content/bookmarks/components/bookmark-picker-modal";
import { ArticleCommentsModal } from "#mobile/features/content/comments/components/article-comments";
import { formatPublicationDate } from "#mobile/features/content/shared/format-publication-date";
import { toPlainText } from "#mobile/features/content/shared/to-plain-text";
import { Button } from "#mobile/ui/components/button";
import { IconButton } from "#mobile/ui/components/icon-button";
import { Screen } from "#mobile/ui/components/screen";
import { ErrorState, LoadingState } from "#mobile/ui/components/status-state";
import { Text } from "#mobile/ui/components/text";
import { screenBottomPadding, screenGutter } from "#mobile/ui/layout";
import { useAppColors } from "#mobile/ui/theme";

export default function ArticleDetailsRoute() {
  const colors = useAppColors();
  const { id } = useLocalSearchParams<{ id: string }>();
  const trpc = useTRPC();
  const article = useQuery(trpc.feed.articles.get.queryOptions({ id }));
  const [isBookmarkPickerVisible, setBookmarkPickerVisible] = useState(false);
  const [isCommentsVisible, setCommentsVisible] = useState(false);

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
      <Stack.Screen
        options={{
          headerRight: ({ tintColor }) => (
            <XStack alignItems="center">
              <IconButton
                accessibilityLabel="Ajouter aux signets"
                onPress={() => setBookmarkPickerVisible(true)}
              >
                <BookmarkIcon color={tintColor ?? colors.primary} size={22} strokeWidth={1.8} />
              </IconButton>
              <IconButton accessibilityLabel="Partager l’article" onPress={handleShare}>
                <Share2Icon color={tintColor ?? colors.primary} size={22} strokeWidth={1.8} />
              </IconButton>
            </XStack>
          ),
          title: "",
        }}
      />

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

          <Button onPress={() => void Linking.openURL(article.data.link)} width="100%">
            Consulter l’article
          </Button>

          <Button
            icon={<MessageCircleIcon color={colors.primary} size={19} strokeWidth={1.8} />}
            onPress={() => setCommentsVisible(true)}
            variant="outline"
            width="100%"
          >
            Commentaires
          </Button>
        </YStack>
      </ScrollView>

      <ArticleCommentsModal
        articleId={article.data.id}
        onClose={() => setCommentsVisible(false)}
        visible={isCommentsVisible}
      />
      <BookmarkPickerModal
        articleId={article.data.id}
        onClose={() => setBookmarkPickerVisible(false)}
        visible={isBookmarkPickerVisible}
      />
    </Screen>
  );
}
