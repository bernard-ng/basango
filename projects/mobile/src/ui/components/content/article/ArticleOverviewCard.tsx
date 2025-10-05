import React from "react";

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
            <Link href={`/(authed)/(tabs)/articles/${data.id}`} asChild>
                <>
                    {data.image && <ArticleCoverImage uri={data.image} width="100%" height={200} />}
                    <YStack marginTop="$2" gap="$2">
                        <Text numberOfLines={2} fontWeight="600" fontSize="$5">
                            {data.title}
                        </Text>
                        <Text size="$3" numberOfLines={2}>
                            {data.excerpt}
                        </Text>
                    </YStack>
                </>
            </Link>

            <YStack marginTop="$2">
                <XStack justifyContent="space-between" alignItems="center">
                    <SourceReferencePill data={data.source} />
                    <Caption>{relativeTime}</Caption>
                </XStack>
            </YStack>
        </Card>
    );
};
