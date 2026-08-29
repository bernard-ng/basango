import { Image } from "expo-image";
import { Link } from "expo-router";
import { Dimensions } from "react-native";
import { XStack, YStack } from "tamagui";

import { SourceReference } from "#mobile/features/content/articles/components/source-reference";
import { formatRelativeTime } from "#mobile/features/content/shared/format-relative-time";
import { toPlainText } from "#mobile/features/content/shared/to-plain-text";
import type { ArticleOverview } from "#mobile/features/content/types";
import { Text } from "#mobile/ui/components/text";

type FeaturedArticleCardProps = {
  article: ArticleOverview;
};

const { width: screenWidth } = Dimensions.get("window");

export function FeaturedArticleCard({ article }: FeaturedArticleCardProps) {
  return (
    <Link asChild href={{ params: { id: article.id }, pathname: "/(app)/(tabs)/articles/[id]" }}>
      <YStack pressStyle={{ opacity: 0.72 }} width={screenWidth * 0.7}>
        <YStack backgroundColor="$surface" borderRadius="$4" height={200} overflow="hidden">
          {article.image ? (
            <Image
              contentFit="cover"
              source={{ uri: article.image }}
              style={{ height: "100%", width: "100%" }}
            />
          ) : (
            <YStack alignItems="center" backgroundColor="$surface" flex={1} justifyContent="center">
              <Text color="$primary" fontWeight="800" variant="heading">
                Basango
              </Text>
            </YStack>
          )}
        </YStack>
        <YStack gap="$2" marginTop="$2">
          <Text fontSize="$5" fontWeight="600" numberOfLines={2}>
            {toPlainText(article.title)}
          </Text>
          {article.excerpt ? (
            <Text fontSize="$3" numberOfLines={2}>
              {toPlainText(article.excerpt)}
            </Text>
          ) : null}
        </YStack>
        <XStack alignItems="center" justifyContent="space-between" marginTop="$2">
          <SourceReference source={article.source} />
          <Text variant="caption">{formatRelativeTime(article.publishedAt)}</Text>
        </XStack>
      </YStack>
    </Link>
  );
}
