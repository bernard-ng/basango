import { Link } from "expo-router";
import { Card, XStack, YStack } from "tamagui";

import { ArticleOverview } from "@/api/schema/feed-management/article";
import { useRelativeTime } from "@/hooks/use-relative-time";
import { SourceReferencePill } from "@/ui/components/content/source/SourceReferencePill";
import { Caption, Text } from "@/ui/components/typography";

type ArticleTextOnlyCardProps = {
  data: ArticleOverview;
};

export const ArticleTextOnlyCard = (props: ArticleTextOnlyCardProps) => {
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
