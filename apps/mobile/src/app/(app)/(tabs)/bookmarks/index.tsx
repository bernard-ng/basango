import { useQuery } from "@tanstack/react-query";
import { Stack } from "expo-router";
import { PlusIcon } from "lucide-react-native";
import { useState } from "react";
import { RefreshControl, ScrollView } from "react-native";
import { YStack } from "tamagui";

import { useTRPC } from "#mobile/application/trpc/client";
import { BookmarkCard } from "#mobile/features/content/bookmarks/components/bookmark-card";
import { BookmarkFormModal } from "#mobile/features/content/bookmarks/components/bookmark-form-modal";
import { IconButton } from "#mobile/ui/components/icon-button";
import { EmptyState, ErrorState, LoadingState } from "#mobile/ui/components/status-state";
import { screenBottomPadding, screenGutter, sectionGap } from "#mobile/ui/layout";
import { useAppColors } from "#mobile/ui/theme";

export default function BookmarksRoute() {
  const colors = useAppColors();
  const trpc = useTRPC();
  const [isFormVisible, setFormVisible] = useState(false);
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
      <Stack.Screen
        options={{
          headerRight: () => (
            <IconButton accessibilityLabel="Créer un signet" onPress={() => setFormVisible(true)}>
              <PlusIcon color={colors.primary} size={24} strokeWidth={1.8} />
            </IconButton>
          ),
        }}
      />
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
              <BookmarkCard
                bookmark={bookmark}
                key={bookmark.id}
                showSeparator={index < bookmarkItems.length - 1}
              />
            ))}
          </YStack>
        )}
      </ScrollView>

      <BookmarkFormModal onClose={() => setFormVisible(false)} visible={isFormVisible} />
    </>
  );
}
