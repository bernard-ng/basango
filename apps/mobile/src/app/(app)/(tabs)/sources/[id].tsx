import { useQuery } from "@tanstack/react-query";
import { Stack, useLocalSearchParams } from "expo-router";
import { ExternalLinkIcon } from "lucide-react-native";
import { useState } from "react";
import { FlatList, Linking, RefreshControl, StyleSheet } from "react-native";
import { XStack, YStack } from "tamagui";

import { useTRPC } from "#mobile/application/trpc/client";
import { ArticleCard } from "#mobile/features/content/articles/components/article-card";
import { ArticleListFooter } from "#mobile/features/content/articles/components/article-list-footer";
import { useInfiniteArticles } from "#mobile/features/content/articles/hooks/use-infinite-articles";
import { FollowButton } from "#mobile/features/content/sources/components/follow-button";
import { Button } from "#mobile/ui/components/button";
import { Screen } from "#mobile/ui/components/screen";
import { SourceAvatar } from "#mobile/ui/components/source-avatar";
import { EmptyState, ErrorState, LoadingState } from "#mobile/ui/components/status-state";
import { Text } from "#mobile/ui/components/text";
import { screenBottomPadding, screenGutter } from "#mobile/ui/layout";
import { useAppColors } from "#mobile/ui/theme";

export default function SourceDetailsRoute() {
  const colors = useAppColors();
  const { id } = useLocalSearchParams<{ id: string }>();
  const trpc = useTRPC();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const source = useQuery(trpc.feed.sources.get.queryOptions({ id }));
  const articleFeed = useInfiniteArticles({ sourceId: id });

  async function handleRefresh() {
    setIsRefreshing(true);

    try {
      await Promise.all([source.refetch(), articleFeed.refetch()]);
    } finally {
      setIsRefreshing(false);
    }
  }

  if (source.isPending || articleFeed.isPending) {
    return (
      <Screen backgroundColor="$groupedBackground" hasNativeHeader>
        <LoadingState label="Chargement de la source…" />
      </Screen>
    );
  }

  if (source.isError || (articleFeed.isError && articleFeed.articles.length === 0)) {
    return (
      <Screen backgroundColor="$groupedBackground" hasNativeHeader>
        <ErrorState onRetry={() => void handleRefresh()} />
      </Screen>
    );
  }

  const displayName = source.data.displayName ?? source.data.name;

  return (
    <Screen backgroundColor="$groupedBackground" hasNativeHeader>
      <Stack.Screen
        options={{
          contentStyle: { backgroundColor: colors.groupedBackground },
          title: displayName,
        }}
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
          <EmptyState
            description="Les prochaines publications apparaîtront ici."
            title="Aucun article"
          />
        }
        ListFooterComponent={
          <ArticleListFooter
            hasError={articleFeed.isFetchNextPageError}
            isLoading={articleFeed.isFetchingNextPage}
            onRetry={articleFeed.loadNextPage}
          />
        }
        ListHeaderComponent={
          <YStack gap="$5" marginBottom="$3">
            <YStack backgroundColor="$card" borderRadius="$5" overflow="hidden">
              <XStack alignItems="center" gap="$3" padding="$4">
                <SourceAvatar name={displayName} size="large" />
                <YStack flex={1} gap="$1">
                  <Text fontSize="$5" fontWeight="600" numberOfLines={2}>
                    {displayName}
                  </Text>
                  <Text variant="caption">{source.data.articlesCount} articles</Text>
                  {source.data.description ? (
                    <Text color="$colorHover" fontSize="$3" numberOfLines={3}>
                      {source.data.description}
                    </Text>
                  ) : null}
                </YStack>
              </XStack>

              <XStack
                borderTopColor="$separator"
                borderTopWidth={StyleSheet.hairlineWidth}
                gap="$3"
                padding="$3"
              >
                <FollowButton presentation="regular" source={source.data} />
                <Button
                  flex={1}
                  onPress={() => void Linking.openURL(source.data.url)}
                  variant="outline"
                >
                  <ExternalLinkIcon color={colors.foreground} size={18} strokeWidth={1.8} />
                  <Text fontWeight="600">Voir le site</Text>
                </Button>
              </XStack>
            </YStack>

            <Text fontSize="$6" fontWeight="700">
              Dernières publications
            </Text>
          </YStack>
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
        renderItem={({ item }) => <ArticleCard article={item} showSource={false} />}
        showsVerticalScrollIndicator={false}
        style={{ backgroundColor: colors.groupedBackground, flex: 1 }}
      />
    </Screen>
  );
}
