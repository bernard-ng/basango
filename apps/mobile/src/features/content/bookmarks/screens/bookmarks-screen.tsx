import { useQuery } from "@tanstack/react-query";
import { Stack, useRouter } from "expo-router";
import { useState } from "react";
import { RefreshControl, ScrollView } from "react-native";
import { YStack } from "tamagui";

import { useTRPC } from "#mobile/application/trpc/client";
import { BookmarkRow } from "#mobile/features/content/bookmarks/components/bookmark-row";
import { EmptyState, ErrorState, LoadingState } from "#mobile/ui/components/status-state";
import { screenBottomPadding, screenGutter, sectionGap } from "#mobile/ui/layout";
import { useAppColors } from "#mobile/ui/theme";

export function BookmarksScreen() {
  const colors = useAppColors();
  const router = useRouter();
  const trpc = useTRPC();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const bookmarks = useQuery(trpc.feed.bookmarks.list.queryOptions({ limit: 100, page: 1 }));

  const bookmarkItems = bookmarks.data?.items ?? [];

  async function handleRefresh() {
    setIsRefreshing(true);
    await bookmarks.refetch();
    setIsRefreshing(false);
  }

  return (
    <>
      <Stack.Toolbar placement="right">
        <Stack.Toolbar.Button
          accessibilityLabel="Créer un signet"
          icon="plus"
          onPress={() => router.push("/(app)/(tabs)/bookmarks/form")}
        />
      </Stack.Toolbar>
      <ScrollView
        contentContainerStyle={{
          gap: sectionGap,
          paddingBottom: screenBottomPadding,
          paddingHorizontal: screenGutter,
        }}
        contentInsetAdjustmentBehavior="automatic"
        refreshControl={
          <RefreshControl
            colors={[colors.primary]}
            onRefresh={() => void handleRefresh()}
            refreshing={isRefreshing}
            tintColor={colors.primary}
          />
        }
        showsVerticalScrollIndicator={false}
        style={{ backgroundColor: colors.groupedBackground, flex: 1 }}
      >
        {bookmarks.isPending ? (
          <LoadingState label="Chargement des signets…" />
        ) : bookmarks.isError ? (
          <ErrorState onRetry={() => void handleRefresh()} />
        ) : bookmarkItems.length === 0 ? (
          <EmptyState
            description="Créez une collection, puis ajoutez-y des articles."
            title="Aucun signet"
          />
        ) : (
          <YStack backgroundColor="$card" borderRadius="$5" overflow="hidden">
            {bookmarkItems.map((bookmark, index) => (
              <BookmarkRow
                bookmark={bookmark}
                key={bookmark.id}
                onPress={() =>
                  router.push({
                    params: { id: bookmark.id },
                    pathname: "/(app)/(tabs)/bookmarks/[id]",
                  })
                }
                showDisclosure
                showSeparator={index < bookmarkItems.length - 1}
              />
            ))}
          </YStack>
        )}
      </ScrollView>
    </>
  );
}
