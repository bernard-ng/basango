import React from "react";

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
        <Card width="100%" backgroundColor="$gray7" borderRadius="$4" padding="$4">
            <XStack gap="$4" justifyContent="space-between">
                <YStack>
                    <XStack flexDirection="row" gap="$3" alignItems="center">
                        <Link href={`/(authed)/(tabs)/bookmarks/${data.id}`}>
                            <YStack flex={1} gap="$2">
                                <Text numberOfLines={2} fontWeight="600" fontSize="$5">
                                    {data.name}
                                </Text>
                                {data.description && (
                                    <Text size="$3" numberOfLines={2} color="$colorHover">
                                        {data.description}
                                    </Text>
                                )}
                            </YStack>
                        </Link>
                    </XStack>

                    <YStack marginTop="$3">
                        <XStack justifyContent="space-between" alignItems="center">
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
