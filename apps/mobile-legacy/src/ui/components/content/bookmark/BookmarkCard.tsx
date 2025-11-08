import { Link } from "expo-router";
import { Card, XStack, YStack } from "tamagui";

import { Bookmark } from "@/api/schema/feed-management/bookmark";
import { useRelativeTime } from "@/hooks/use-relative-time";
import { Caption, Text } from "@/ui/components/typography";

type BookmarkCardProps = {
  data: Bookmark;
};

export const BookmarkCard = (props: BookmarkCardProps) => {
  const { data } = props;
  const relativeTime = useRelativeTime(data.createdAt);

  return (
    <Card backgroundColor="$gray7" borderRadius="$4" padding="$4" width="100%">
      <XStack gap="$4" justifyContent="space-between">
        <YStack>
          <XStack alignItems="center" flexDirection="row" gap="$3">
            <Link href={`/(authed)/(tabs)/bookmarks/${data.id}`}>
              <YStack flex={1} gap="$2">
                <Text fontSize="$5" fontWeight="600" numberOfLines={2}>
                  {data.name}
                </Text>
                {data.description && (
                  <Text color="$colorHover" numberOfLines={2} size="$3">
                    {data.description}
                  </Text>
                )}
              </YStack>
            </Link>
          </XStack>

          <YStack marginTop="$3">
            <XStack alignItems="center" justifyContent="space-between">
              <Caption>{data.isPublic}</Caption>
              <Caption>{data.articlesCount} articles</Caption>
              <Caption>{relativeTime}</Caption>
            </XStack>
          </YStack>
        </YStack>
      </XStack>
    </Card>
  );
};
