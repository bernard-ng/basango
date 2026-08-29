import { Image } from "expo-image";
import { Link } from "expo-router";
import { XStack, YStack } from "tamagui";

import { SourceReference } from "#mobile/features/content/articles/components/source-reference";
import { formatRelativeTime } from "#mobile/features/content/shared/format-relative-time";
import { toPlainText } from "#mobile/features/content/shared/to-plain-text";
import type { ArticleOverview } from "#mobile/features/content/types";
import { Text } from "#mobile/ui/components/text";

type ArticleCardProps = {
  article: ArticleOverview;
  showSource?: boolean;
};

export function ArticleCard({ article, showSource = true }: ArticleCardProps) {
  return (
    <Link asChild href={{ params: { id: article.id }, pathname: "/(app)/(tabs)/articles/[id]" }}>
      <YStack paddingVertical="$2" pressStyle={{ opacity: 0.72 }}>
        <XStack alignItems="center" gap="$3">
          <YStack flex={1} gap="$2">
            <Text fontSize="$5" fontWeight="600" numberOfLines={2}>
              {toPlainText(article.title)}
            </Text>
            {article.excerpt ? (
              <Text color="$colorHover" fontSize="$3" numberOfLines={2}>
                {toPlainText(article.excerpt)}
              </Text>
            ) : null}
          </YStack>
          {article.image ? (
            <Image
              contentFit="cover"
              source={{ uri: article.image }}
              style={{ borderRadius: 12, height: 90, width: 120 }}
              transition={180}
            />
          ) : null}
        </XStack>
        <XStack
          alignItems="center"
          justifyContent={showSource ? "space-between" : "flex-start"}
          marginTop="$3"
        >
          {showSource ? <SourceReference source={article.source} /> : null}
          <Text flexShrink={0} variant="caption">
            {formatRelativeTime(article.publishedAt)}
          </Text>
        </XStack>
      </YStack>
    </Link>
  );
}
