import { Bookmark, MoreVertical, Share } from "@tamagui/lucide-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import Toast from "react-native-toast-message";
import { Button, H5, ScrollView, Separator, XStack, YStack } from "tamagui";

import { useArticleDetails } from "@/api/request/feed-management/article";
import { Article } from "@/api/schema/feed-management/article";
import { safeMessage } from "@/api/shared";
import { useRelativeTime } from "@/hooks/use-relative-time";
import { ArticleCategoryPill, ArticleCoverImage } from "@/ui/components/content/article";
import { SourceReferencePill } from "@/ui/components/content/source";
import { BackButton } from "@/ui/components/controls/BackButton";
import { IconButton } from "@/ui/components/controls/IconButton";
import { LoadingView } from "@/ui/components/LoadingView";
import { ScreenView } from "@/ui/components/layout";
import { Caption, Text } from "@/ui/components/typography";

export default function ArticleDetails() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { data, isLoading, error } = useArticleDetails(id as string);
  const article: Article | undefined = data ?? undefined;
  const relativeTime = useRelativeTime(article?.publishedAt);

  const handleReadIntegrality = async () => {
    await WebBrowser.openBrowserAsync(article!.link);
  };

  if (error) {
    Toast.show({
      text1: "Erreur",
      text2: safeMessage(error),
      type: "error",
    });
    router.replace("/(authed)/(tabs)/articles");
  }

  if (isLoading || article === undefined) {
    return <LoadingView />;
  }

  return (
    <ScreenView>
      <ScreenView.Heading
        leadingAction={<BackButton onPress={() => router.dismissTo("/(authed)/(tabs)/articles")} />}
        trailingActions={
          <>
            <IconButton icon={<Bookmark size="$1" />} onPress={() => {}} />
            <IconButton icon={<Share size="$1" />} onPress={() => {}} />
            <IconButton icon={<MoreVertical size="$1" />} onPress={() => {}} />
          </>
        }
      />
      <ScrollView>
        <YStack>
          {article.metadata?.image && (
            <ArticleCoverImage
              height={225}
              marginBottom="$4"
              uri={article.metadata.image}
              width="100%"
            />
          )}
        </YStack>
        <YStack backgroundColor="$background" gap="$4">
          <XStack flexWrap="wrap" gap="$2">
            {article.categories.map((category, index) => (
              <ArticleCategoryPill category={category.toLowerCase()} key={index} />
            ))}
          </XStack>
          <H5 fontWeight="bold" marginBottom="$1">
            {article.title}
          </H5>

          <YStack gap="$2">
            <SourceReferencePill data={article.source} />
            <XStack alignItems="center" height={20}>
              <Caption>{relativeTime}</Caption>
              <Separator alignSelf="stretch" marginHorizontal={16} vertical />
              <Caption>{article.readingTime} minutes de lecture</Caption>
            </XStack>
          </YStack>

          <Text marginTop="$2" size="$3">
            {article.body.trim()}
          </Text>
        </YStack>
        <Button fontWeight="bold" onPress={handleReadIntegrality} theme="accent" width="100%">
          Consulter l&#39;article
        </Button>
      </ScrollView>
    </ScreenView>
  );
}
