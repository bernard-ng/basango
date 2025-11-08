import { Link } from "expo-router";
import { Card, XStack, YStack } from "tamagui";

import { ArticleOverview } from "@/api/schema/feed-management/article";
import { useRelativeTime } from "@/hooks/use-relative-time";
import { ArticleCoverImage } from "@/ui/components/content/article/ArticleCoverImage";
import { SourceReferencePill } from "@/ui/components/content/source/SourceReferencePill";
import { Caption, Text } from "@/ui/components/typography";

type ArticleMagazineCardProps = {
  data: ArticleOverview;
};

export const ArticleMagazineCard = (props: ArticleMagazineCardProps) => {
  const { data } = props;
  const relativeTime = useRelativeTime(data.publishedAt);

  return (
    <Card backgroundColor="transparent" borderRadius="$4" padding={0} width="100%">
      <Link href={`/(authed)/(tabs)/articles/${data.id}`}>
        <XStack alignItems="center" flexDirection="row" gap="$3">
          <YStack flex={1} gap="$2">
            <Text fontSize="$5" fontWeight="600" numberOfLines={2}>
              {data.title}
            </Text>
            <Text color="$colorHover" numberOfLines={2} size="$3">
              {data.excerpt}
            </Text>
          </YStack>

          {data.image && <ArticleCoverImage height={90} uri={data.image} width={120} />}
        </XStack>
      </Link>

      <YStack marginTop="$3">
        <XStack alignItems="center" justifyContent="space-between">
          <SourceReferencePill data={data.source} />
          <Caption>{relativeTime}</Caption>
        </XStack>
      </YStack>
    </Card>
  );
};
