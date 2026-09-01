import { useQuery } from "@tanstack/react-query";
import { ScrollView, YStack } from "tamagui";

import { useTRPC } from "#mobile/application/trpc/client";
import { BookmarkRow } from "#mobile/features/content/bookmarks/components/bookmark-row";
import { useArticleBookmarks } from "#mobile/features/content/bookmarks/hooks/use-article-bookmarks";
import { EmptyState, ErrorState, LoadingState } from "#mobile/ui/components/status-state";

type BookmarkPickerProps = {
  articleId: string;
};

export function BookmarkPicker({ articleId }: BookmarkPickerProps) {
  const trpc = useTRPC();
  const bookmarks = useQuery(trpc.public.bookmarks.list.queryOptions({ limit: 100, page: 1 }));
  const articleBookmarks = useArticleBookmarks(articleId);
  const bookmarkItems = bookmarks.data?.items ?? [];
  const isPending = bookmarks.isPending || articleBookmarks.isPending;
  const isError = bookmarks.isError || articleBookmarks.isError;

  function handleRetry() {
    void Promise.all([bookmarks.refetch(), articleBookmarks.refetch()]);
  }

  return (
    <ScrollView
      backgroundColor="$groupedBackground"
      contentContainerStyle={{ paddingBottom: 24, paddingHorizontal: 20, paddingTop: 12 }}
      contentInsetAdjustmentBehavior="automatic"
    >
      {isPending ? <LoadingState /> : null}
      {!isPending && isError ? <ErrorState onRetry={handleRetry} /> : null}
      {!isPending && !isError && bookmarkItems.length === 0 ? (
        <EmptyState
          description="Créez d’abord un signet depuis l’onglet Signets."
          title="Aucun signet"
        />
      ) : null}
      {!isPending && !isError && bookmarkItems.length > 0 ? (
        <YStack backgroundColor="$card" borderRadius="$5" overflow="hidden">
          {bookmarkItems.map((bookmark, index) => (
            <BookmarkRow
              bookmark={bookmark}
              disabled={articleBookmarks.isUpdating}
              isSelected={articleBookmarks.bookmarkIds.has(bookmark.id)}
              key={bookmark.id}
              onPress={() => articleBookmarks.toggleBookmark(bookmark.id)}
              showSeparator={index < bookmarkItems.length - 1}
            />
          ))}
        </YStack>
      ) : null}
    </ScrollView>
  );
}
