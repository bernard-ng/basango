import { useQuery } from "@tanstack/react-query";
import { useLocalSearchParams } from "expo-router";

import { useTRPC } from "#mobile/application/trpc/client";
import { BookmarkForm } from "#mobile/features/content/bookmarks/components/bookmark-form";
import { ErrorState, LoadingState } from "#mobile/ui/components/status-state";

export function BookmarkFormScreen() {
  const { bookmarkId } = useLocalSearchParams<{ bookmarkId?: string }>();
  const trpc = useTRPC();
  const bookmarks = useQuery({
    ...trpc.feed.bookmarks.list.queryOptions({ limit: 100, page: 1 }),
    enabled: Boolean(bookmarkId),
  });

  if (bookmarkId && bookmarks.isPending) {
    return <LoadingState label="Chargement du signet…" />;
  }

  if (bookmarkId && bookmarks.isError) {
    return <ErrorState onRetry={() => void bookmarks.refetch()} />;
  }

  const bookmark = bookmarks.data?.items.find((item) => item.id === bookmarkId);

  if (bookmarkId && !bookmark) {
    return <ErrorState description="Ce signet est introuvable." />;
  }

  return <BookmarkForm bookmark={bookmark} />;
}
