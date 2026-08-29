import { useQuery } from "@tanstack/react-query";
import { Stack } from "expo-router";
import { useState } from "react";
import { RefreshControl, ScrollView } from "react-native";
import { YStack } from "tamagui";

import { useTRPC } from "#mobile/application/trpc/client";
import { SourceCard } from "#mobile/features/content/sources/components/source-card";
import { SectionHeader } from "#mobile/ui/components/section-header";
import { EmptyState, ErrorState, LoadingState } from "#mobile/ui/components/status-state";
import { screenBottomPadding, screenGutter, sectionGap } from "#mobile/ui/layout";
import { useAppColors } from "#mobile/ui/theme";

export function SourcesScreen() {
  const colors = useAppColors();
  const trpc = useTRPC();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const sources = useQuery(
    trpc.feed.sources.list.queryOptions({
      limit: 100,
      page: 1,
      search: search.trim() || undefined,
    }),
  );
  const followedSources = useQuery(
    trpc.feed.sources.list.queryOptions({ followedOnly: true, limit: 100, page: 1 }),
  );

  const sourceItems = sources.data?.items ?? [];
  const followedItems = followedSources.data?.items ?? [];
  const followedIds = new Set(followedItems.map((source) => source.id));
  const discoveryItems = sourceItems.filter((source) => !followedIds.has(source.id));
  const isSearching = search.trim().length > 0;

  async function handleRefresh() {
    setIsRefreshing(true);
    await Promise.all([sources.refetch(), followedSources.refetch()]);
    setIsRefreshing(false);
  }

  return (
    <>
      <Stack.Screen
        options={{
          contentStyle: { backgroundColor: colors.groupedBackground },
          headerSearchBarOptions: {
            hideWhenScrolling: false,
            onChangeText: (event) => setSearch(event.nativeEvent.text),
            placeholder: "Rechercher une source",
            placement: "integratedButton",
            tintColor: colors.primary,
          },
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
        {sources.isPending || followedSources.isPending ? (
          <LoadingState label="Chargement des sources…" />
        ) : sources.isError || followedSources.isError ? (
          <ErrorState onRetry={() => void handleRefresh()} />
        ) : sourceItems.length === 0 ? (
          <EmptyState
            description="Aucune source ne correspond à votre recherche."
            title="Aucun résultat"
          />
        ) : isSearching ? (
          <YStack gap="$2">
            <SectionHeader title="Résultats" />
            <YStack backgroundColor="$card" borderRadius="$5" paddingHorizontal="$3">
              {sourceItems.map((source, index) => (
                <SourceCard
                  key={source.id}
                  showSeparator={index < sourceItems.length - 1}
                  source={source}
                />
              ))}
            </YStack>
          </YStack>
        ) : (
          <>
            {followedItems.length > 0 ? (
              <YStack gap="$2">
                <SectionHeader title="Sources suivies" />
                <YStack backgroundColor="$card" borderRadius="$5" paddingHorizontal="$3">
                  {followedItems.map((source, index) => (
                    <SourceCard
                      key={source.id}
                      showSeparator={index < followedItems.length - 1}
                      source={source}
                    />
                  ))}
                </YStack>
              </YStack>
            ) : null}

            {discoveryItems.length > 0 ? (
              <YStack gap="$2">
                <SectionHeader
                  title={followedItems.length > 0 ? "À découvrir" : "Toutes les sources"}
                />
                <YStack backgroundColor="$card" borderRadius="$5" paddingHorizontal="$3">
                  {discoveryItems.map((source, index) => (
                    <SourceCard
                      key={source.id}
                      showSeparator={index < discoveryItems.length - 1}
                      source={source}
                    />
                  ))}
                </YStack>
              </YStack>
            ) : null}
          </>
        )}
      </ScrollView>
    </>
  );
}
