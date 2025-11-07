import React from "react";

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
        <Card width="100%" backgroundColor="transparent" borderRadius="$4" padding={0}>
            <Link href={`/(authed)/(tabs)/articles/${data.id}`}>
                <XStack flexDirection="row" gap="$3" alignItems="center">
                    <YStack flex={1} gap="$2">
                        <Text numberOfLines={2} fontWeight="600" fontSize="$5">
                            {data.title}
                        </Text>
                        <Text size="$3" numberOfLines={2} color="$colorHover">
                            {data.excerpt}
                        </Text>
                    </YStack>
                </XStack>
            </Link>

            <YStack marginTop="$3">
                <XStack justifyContent="space-between" alignItems="center">
                    <SourceReferencePill data={data.source} />
                    <Caption>{relativeTime}</Caption>
                </XStack>
            </YStack>
        </Card>
    );
};
