import { Stack } from "expo-router";
import { useState } from "react";
import { FlatList, RefreshControl } from "react-native";
import { YStack } from "tamagui";

import { EmptyState, ErrorState, LoadingState } from "#mobile/ui/components/status-state";
import { screenBottomPadding, screenGutter } from "#mobile/ui/layout";
import { useAppColors } from "#mobile/ui/theme";

import { ArticleCard } from "../components/article-card";
import { ArticleCategoryFilter } from "../components/article-category-filter";
import { ArticleListFooter } from "../components/article-list-footer";
import { useInfiniteArticles } from "../hooks/use-infinite-articles";

export function AllArticlesScreen() {
  const colors = useAppColors();
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

  return (
    <>
      <Stack.SearchBar
        hideWhenScrolling={false}
        onChangeText={(event) => setSearch(event.nativeEvent.text)}
        placeholder="Rechercher une actualité"
        placement="integratedButton"
        tintColor={colors.primary}
      />
      <FlatList
        contentContainerStyle={{
          paddingBottom: screenBottomPadding,
          paddingHorizontal: screenGutter,
        }}
        contentInsetAdjustmentBehavior="automatic"
        data={articleFeed.articles}
        ItemSeparatorComponent={() => <YStack height="$2" />}
        keyExtractor={(article) => article.id}
        ListEmptyComponent={
          articleFeed.isPending ? (
            <LoadingState />
          ) : articleFeed.isError ? (
            <ErrorState onRetry={() => void handleRefresh()} />
          ) : hasActiveFilters ? (
            <EmptyState
              description="Essayez une autre recherche ou une autre catégorie."
              title="Aucune actualité trouvée"
            />
          ) : (
            <EmptyState
              description="Les prochaines publications apparaîtront ici."
              title="Aucune actualité"
            />
          )
        }
        ListFooterComponent={
          <ArticleListFooter
            hasError={articleFeed.isFetchNextPageError}
            isLoading={articleFeed.isFetchingNextPage}
            onRetry={articleFeed.loadNextPage}
          />
        }
        ListHeaderComponent={
          <ArticleCategoryFilter
            onChange={setSelectedCategoryId}
            selectedCategoryId={selectedCategoryId}
          />
        }
        ListHeaderComponentStyle={{ marginBottom: 8 }}
        onEndReached={articleFeed.loadNextPage}
        onEndReachedThreshold={0.6}
        refreshControl={
          <RefreshControl
            colors={[colors.primary]}
            onRefresh={() => void handleRefresh()}
            refreshing={isRefreshing}
            tintColor={colors.primary}
          />
        }
        renderItem={({ item }) => <ArticleCard article={item} />}
        showsVerticalScrollIndicator={false}
        style={{ backgroundColor: colors.background, flex: 1 }}
      />
    </>
  );
}
