import React from "react";

import { ScrollView, YStack } from "tamagui";

import { useArticleOverviewList } from "@/api/request/feed-management/article";
import { useSourceOverviewList } from "@/api/request/feed-management/source";
import { ArticleOverview } from "@/api/schema/feed-management/article";
import { SourceOverview } from "@/api/schema/feed-management/source";
import { useFlattenedItems } from "@/hooks/use-flattened-items";
import { ArticleList, ArticleSkeletonList } from "@/ui/components/content/article";
import { SourceList, SourceSkeletonList } from "@/ui/components/content/source";
import { ScreenView } from "@/ui/components/layout";
import { Heading } from "@/ui/components/typography";

export default function Index() {
    const { data: articles, isLoading: articlesLoading } = useArticleOverviewList({ limit: 10 });
    const { data: sources, isLoading: sourcesLoading } = useSourceOverviewList();
    const articleOverviews: ArticleOverview[] = useFlattenedItems(articles);
    const sourcesOverviews: SourceOverview[] = useFlattenedItems(sources);

    return (
        <ScreenView paddingBottom={0}>
            <Heading>Actualités</Heading>
            <ScrollView contentContainerStyle={{ paddingBottom: 0 }}>
                <YStack gap="$4">
                    <YStack gap="$2">
                        <ScreenView.Section title="Tendances" forwardLink="/(authed)/(tabs)/articles/trending" />

                        {articlesLoading && <ArticleSkeletonList displayMode="card" horizontal={true} />}
                        {!articlesLoading && (
                            <ArticleList
                                data={articleOverviews}
                                refreshing={articlesLoading}
                                displayMode="card"
                                horizontal={true}
                            />
                        )}
                    </YStack>
                    <YStack gap="$2">
                        <ScreenView.Section title="Nos sources" forwardLink="/(authed)/(tabs)/sources" />

                        {sourcesLoading && <SourceSkeletonList horizontal={true} />}
                        {!sourcesLoading && (
                            <SourceList data={sourcesOverviews} refreshing={sourcesLoading} horizontal={true} />
                        )}
                    </YStack>
                </YStack>
            </ScrollView>
        </ScreenView>
    );
}
