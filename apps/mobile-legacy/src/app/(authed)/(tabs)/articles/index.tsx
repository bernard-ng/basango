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
            <ScreenView.Section
              forwardLink="/(authed)/(tabs)/articles/trending"
              title="Tendances"
            />

            {articlesLoading && <ArticleSkeletonList displayMode="card" horizontal={true} />}
            {!articlesLoading && (
              <ArticleList
                data={articleOverviews}
                displayMode="card"
                horizontal={true}
                refreshing={articlesLoading}
              />
            )}
          </YStack>
          <YStack gap="$2">
            <ScreenView.Section forwardLink="/(authed)/(tabs)/sources" title="Nos sources" />

            {sourcesLoading && <SourceSkeletonList horizontal={true} />}
            {!sourcesLoading && (
              <SourceList data={sourcesOverviews} horizontal={true} refreshing={sourcesLoading} />
            )}
          </YStack>
        </YStack>
      </ScrollView>
    </ScreenView>
  );
}
