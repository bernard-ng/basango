import { useState } from "react";
import { FlatList, RefreshControl } from "react-native";
import { YStack } from "tamagui";

import { ArticleCard } from "#mobile/features/content/articles/components/article-card";
import { ArticleListFooter } from "#mobile/features/content/articles/components/article-list-footer";
import { useInfiniteArticles } from "#mobile/features/content/articles/hooks/use-infinite-articles";
import { EmptyState, ErrorState, LoadingState } from "#mobile/ui/components/status-state";
import { screenBottomPadding, screenGutter } from "#mobile/ui/layout";
import { useAppColors } from "#mobile/ui/theme";

export default function AllArticlesRoute() {
  const colors = useAppColors();
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

  return (
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
  );
}
