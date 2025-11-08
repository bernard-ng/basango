import { Link } from "expo-router";
import { Card, XStack, YStack } from "tamagui";

import { ArticleOverview } from "@/api/schema/feed-management/article";
import { useRelativeTime } from "@/hooks/use-relative-time";
import { ArticleCoverImage } from "@/ui/components/content/article/ArticleCoverImage";
import { SourceReferencePill } from "@/ui/components/content/source/SourceReferencePill";
import { Caption, Text } from "@/ui/components/typography";

type ArticleOverviewCardProps = {
  data: ArticleOverview;
};

export const ArticleOverviewCard = (props: ArticleOverviewCardProps) => {
  const { data } = props;
  const relativeTime = useRelativeTime(data.publishedAt);

  return (
    <Card backgroundColor="transparent">
      <Link asChild href={`/(authed)/(tabs)/articles/${data.id}`}>
        {data.image && <ArticleCoverImage height={200} uri={data.image} width="100%" />}
        <YStack gap="$2" marginTop="$2">
          <Text fontSize="$5" fontWeight="600" numberOfLines={2}>
            {data.title}
          </Text>
          <Text numberOfLines={2} size="$3">
            {data.excerpt}
          </Text>
        </YStack>
      </Link>

      <YStack marginTop="$2">
        <XStack alignItems="center" justifyContent="space-between">
          <SourceReferencePill data={data.source} />
          <Caption>{relativeTime}</Caption>
        </XStack>
      </YStack>
    </Card>
  );
};
