import { useRouter } from "expo-router";
import { useState } from "react";
import type { NativeScrollEvent, NativeSyntheticEvent } from "react-native";
import { RefreshControl, ScrollView } from "react-native";
import { YStack } from "tamagui";

import { ArticleCard } from "#mobile/features/content/articles/components/article-card";
import { ArticleListFooter } from "#mobile/features/content/articles/components/article-list-footer";
import { FeaturedArticleCard } from "#mobile/features/content/articles/components/featured-article-card";
import { useInfiniteArticles } from "#mobile/features/content/articles/hooks/use-infinite-articles";
import { SectionHeader } from "#mobile/ui/components/section-header";
import { ErrorState, LoadingState } from "#mobile/ui/components/status-state";
import { screenBottomPadding, screenGutter, sectionGap } from "#mobile/ui/layout";
import { useAppColors } from "#mobile/ui/theme";

export default function ArticlesHomeRoute() {
  const colors = useAppColors();
  const router = useRouter();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const articleFeed = useInfiniteArticles();

  async function handleRefresh() {
    setIsRefreshing(true);

    try {
      await articleFeed.refetch();
    } finally {
      setIsRefreshing(false);
    }
  }

  function handleFeedScroll(event: NativeSyntheticEvent<NativeScrollEvent>) {
    const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
    const distanceFromBottom = contentSize.height - layoutMeasurement.height - contentOffset.y;

    if (distanceFromBottom < 480) {
      articleFeed.loadNextPage();
    }
  }

  const articleItems = articleFeed.articles;
  const featuredArticles = articleItems.slice(0, 5);
  const latestArticles = articleItems.slice(5);

  return (
    <ScrollView
      contentContainerStyle={{
        paddingBottom: screenBottomPadding,
        paddingHorizontal: screenGutter,
      }}
      contentInsetAdjustmentBehavior="automatic"
      onScroll={handleFeedScroll}
      refreshControl={
        <RefreshControl
          colors={[colors.primary]}
          onRefresh={() => void handleRefresh()}
          refreshing={isRefreshing}
          tintColor={colors.primary}
        />
      }
      scrollEventThrottle={16}
      showsVerticalScrollIndicator={false}
      style={{ backgroundColor: colors.background, flex: 1 }}
    >
      {articleFeed.isPending ? (
        <LoadingState label="Chargement de l’actualité…" />
      ) : articleFeed.isError && articleItems.length === 0 ? (
        <ErrorState onRetry={() => void handleRefresh()} />
      ) : (
        <YStack gap="$5">
          <YStack gap="$2">
            <SectionHeader
              onAction={() => router.push("/(app)/(tabs)/articles/all")}
              title="À la une"
            />

            <ScrollView
              contentContainerStyle={{ gap: sectionGap }}
              horizontal
              showsHorizontalScrollIndicator={false}
            >
              {featuredArticles.map((article) => (
                <FeaturedArticleCard article={article} key={article.id} />
              ))}
            </ScrollView>
          </YStack>

          <YStack gap="$2">
            <SectionHeader
              onAction={() => router.push("/(app)/(tabs)/articles/all")}
              title="Dernières actualités"
            />
            {latestArticles.map((article) => (
              <ArticleCard article={article} key={article.id} />
            ))}
            <ArticleListFooter
              hasError={articleFeed.isFetchNextPageError}
              isLoading={articleFeed.isFetchingNextPage}
              onRetry={articleFeed.loadNextPage}
            />
          </YStack>
        </YStack>
      )}
    </ScrollView>
  );
}
