import type { RouterOutputs } from "@basango/api/trpc/routers/_app";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRef } from "react";
import { Alert } from "react-native";

import { useTRPC } from "#mobile/application/trpc/client";

type ArticleBookmarkMemberships = RouterOutputs["feed"]["bookmarks"]["memberships"];
type BookmarkList = RouterOutputs["feed"]["bookmarks"]["list"];
type BookmarkListSnapshot = [readonly unknown[], BookmarkList | undefined][];

type BookmarkRollbackState = {
  bookmarkLists: BookmarkListSnapshot;
  memberships: ArticleBookmarkMemberships | undefined;
};

export function useArticleBookmarks(articleId: string) {
  const queryClient = useQueryClient();
  const trpc = useTRPC();
  const membershipsQueryOptions = trpc.feed.bookmarks.memberships.queryOptions({ id: articleId });
  const memberships = useQuery(membershipsQueryOptions);
  const addRollbackState = useRef<BookmarkRollbackState | undefined>(undefined);
  const removeRollbackState = useRef<BookmarkRollbackState | undefined>(undefined);

  function updateMembership(bookmarkId: string, isSaved: boolean) {
    queryClient.setQueryData<ArticleBookmarkMemberships>(
      membershipsQueryOptions.queryKey,
      (current) => {
        const bookmarkIds = new Set(current?.bookmarkIds ?? []);

        if (isSaved) {
          bookmarkIds.add(bookmarkId);
        } else {
          bookmarkIds.delete(bookmarkId);
        }

        return { bookmarkIds: [...bookmarkIds] };
      },
    );
  }

  function updateBookmarkCount(bookmarkId: string, difference: 1 | -1) {
    queryClient.setQueriesData<BookmarkList>(trpc.feed.bookmarks.list.queryFilter(), (current) => {
      if (!current) {
        return current;
      }

      return {
        ...current,
        items: current.items.map((bookmark) =>
          bookmark.id === bookmarkId
            ? {
                ...bookmark,
                articlesCount: Math.max(0, bookmark.articlesCount + difference),
              }
            : bookmark,
        ),
      };
    });
  }

  function invalidateBookmarkQueries() {
    void queryClient.invalidateQueries({ queryKey: membershipsQueryOptions.queryKey });
    void queryClient.invalidateQueries(trpc.feed.bookmarks.list.queryFilter());
    void queryClient.invalidateQueries({
      queryKey: trpc.feed.bookmarks.listArticles.pathKey(),
    });
  }

  function restoreBookmarkState(state: BookmarkRollbackState | undefined) {
    if (!state) {
      return;
    }

    queryClient.setQueryData(membershipsQueryOptions.queryKey, state.memberships);
    state.bookmarkLists.forEach(([queryKey, data]) => {
      queryClient.setQueryData(queryKey, data);
    });
  }

  const addArticle = useMutation({
    ...trpc.feed.bookmarks.addArticle.mutationOptions(),
    onError(error) {
      restoreBookmarkState(addRollbackState.current);
      Alert.alert(
        "Ajout impossible",
        error.message || "Impossible d’ajouter cet article au signet.",
      );
    },
    async onMutate(input) {
      await Promise.all([
        queryClient.cancelQueries({ queryKey: membershipsQueryOptions.queryKey }),
        queryClient.cancelQueries(trpc.feed.bookmarks.list.queryFilter()),
      ]);
      addRollbackState.current = {
        bookmarkLists: queryClient.getQueriesData<BookmarkList>(
          trpc.feed.bookmarks.list.queryFilter(),
        ),
        memberships: queryClient.getQueryData<ArticleBookmarkMemberships>(
          membershipsQueryOptions.queryKey,
        ),
      };

      updateMembership(input.bookmarkId, true);
      updateBookmarkCount(input.bookmarkId, 1);

      return undefined;
    },
    onSettled: invalidateBookmarkQueries,
  });
  const removeArticle = useMutation({
    ...trpc.feed.bookmarks.removeArticle.mutationOptions(),
    onError(error) {
      restoreBookmarkState(removeRollbackState.current);
      Alert.alert(
        "Retrait impossible",
        error.message || "Impossible de retirer cet article du signet.",
      );
    },
    async onMutate(input) {
      await Promise.all([
        queryClient.cancelQueries({ queryKey: membershipsQueryOptions.queryKey }),
        queryClient.cancelQueries(trpc.feed.bookmarks.list.queryFilter()),
      ]);
      removeRollbackState.current = {
        bookmarkLists: queryClient.getQueriesData<BookmarkList>(
          trpc.feed.bookmarks.list.queryFilter(),
        ),
        memberships: queryClient.getQueryData<ArticleBookmarkMemberships>(
          membershipsQueryOptions.queryKey,
        ),
      };

      updateMembership(input.bookmarkId, false);
      updateBookmarkCount(input.bookmarkId, -1);

      return undefined;
    },
    onSettled: invalidateBookmarkQueries,
  });

  const bookmarkIds = new Set(memberships.data?.bookmarkIds ?? []);
  const isUpdating = addArticle.isPending || removeArticle.isPending;

  function toggleBookmark(bookmarkId: string) {
    if (isUpdating) {
      return;
    }

    if (bookmarkIds.has(bookmarkId)) {
      removeArticle.mutate({ articleId, bookmarkId });
      return;
    }

    addArticle.mutate({ articleId, bookmarkId });
  }

  return {
    bookmarkIds,
    isBookmarked: bookmarkIds.size > 0,
    isError: memberships.isError,
    isPending: memberships.isPending,
    isUpdating,
    refetch: memberships.refetch,
    toggleBookmark,
  };
}
