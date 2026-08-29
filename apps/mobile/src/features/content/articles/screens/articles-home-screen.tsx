import { Stack, useRouter } from "expo-router";
import { useState } from "react";
import type { NativeScrollEvent, NativeSyntheticEvent } from "react-native";
import { RefreshControl, ScrollView } from "react-native";
import { YStack } from "tamagui";

import { SectionHeader } from "#mobile/ui/components/section-header";
import { EmptyState, ErrorState, LoadingState } from "#mobile/ui/components/status-state";
import { screenBottomPadding, screenGutter, sectionGap } from "#mobile/ui/layout";
import { useAppColors } from "#mobile/ui/theme";

import { ArticleCard } from "../components/article-card";
import { ArticleCategoryFilter } from "../components/article-category-filter";
import { ArticleListFooter } from "../components/article-list-footer";
import { FeaturedArticleCard } from "../components/featured-article-card";
import { useInfiniteArticles } from "../hooks/use-infinite-articles";

export function ArticlesHomeScreen() {
  const colors = useAppColors();
  const router = useRouter();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>();
  const normalizedSearch = search.trim();
  const hasActiveFilters = normalizedSearch.length > 0 || selectedCategoryId !== undefined;
  const articleFeed = useInfiniteArticles({
    categoryId: selectedCategoryId,
    search: normalizedSearch || undefined,
  });

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
    <>
      <Stack.SearchBar
        hideWhenScrolling={false}
        onChangeText={(event) => setSearch(event.nativeEvent.text)}
        placeholder="Rechercher une actualité"
        placement="integratedButton"
        tintColor={colors.primary}
      />
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
        <YStack gap="$4">
          <ArticleCategoryFilter
            onChange={setSelectedCategoryId}
            selectedCategoryId={selectedCategoryId}
          />

          {articleFeed.isPending ? (
            <LoadingState label="Chargement de l’actualité…" />
          ) : articleFeed.isError && articleItems.length === 0 ? (
            <ErrorState onRetry={() => void handleRefresh()} />
          ) : hasActiveFilters ? (
            <YStack gap="$2">
              <SectionHeader title="Résultats" />
              {articleItems.length === 0 ? (
                <EmptyState
                  description="Essayez une autre recherche ou une autre catégorie."
                  title="Aucune actualité trouvée"
                />
              ) : (
                articleItems.map((article) => <ArticleCard article={article} key={article.id} />)
              )}
              <ArticleListFooter
                hasError={articleFeed.isFetchNextPageError}
                isLoading={articleFeed.isFetchingNextPage}
                onRetry={articleFeed.loadNextPage}
              />
            </YStack>
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
        </YStack>
      </ScrollView>
    </>
  );
}
