import type { RouterOutputs } from "@basango/api/trpc/routers/_app";
import { type InfiniteData, type QueryKey, useInfiniteQuery } from "@tanstack/react-query";
import { useCallback, useMemo } from "react";

import { useTRPC, useTRPCClient } from "#mobile/application/trpc/client";
import { ARTICLES_PAGE_SIZE } from "#mobile/features/content/articles/hooks/use-infinite-articles";
import { getNextPage } from "#mobile/features/content/shared/get-next-page";

type BookmarkArticlePage = RouterOutputs["feed"]["bookmarks"]["listArticles"];

export function useInfiniteBookmarkArticles(bookmarkId: string) {
  const trpc = useTRPC();
  const trpcClient = useTRPCClient();
  const queryKey = trpc.feed.bookmarks.listArticles.queryKey({
    bookmarkId,
    limit: ARTICLES_PAGE_SIZE,
  });
  const query = useInfiniteQuery<
    BookmarkArticlePage,
    Error,
    InfiniteData<BookmarkArticlePage, number>,
    QueryKey,
    number
  >({
    enabled: bookmarkId.length > 0,
    getNextPageParam: (lastPage) => getNextPage(lastPage.meta),
    initialPageParam: 1,
    queryFn: async ({ pageParam, signal }): Promise<BookmarkArticlePage> =>
      trpcClient.feed.bookmarks.listArticles.query(
        { bookmarkId, limit: ARTICLES_PAGE_SIZE, page: pageParam },
        { signal },
      ),
    queryKey: [...queryKey, "infinite-pages"],
  });
  const articles = useMemo(() => {
    const uniqueArticles = new Map(
      query.data?.pages.flatMap((page) => page.items).map((article) => [article.id, article]),
    );

    return [...uniqueArticles.values()];
  }, [query.data?.pages]);
  const loadNextPage = useCallback(() => {
    if (query.hasNextPage && !query.isFetchingNextPage) {
      void query.fetchNextPage();
    }
  }, [query.fetchNextPage, query.hasNextPage, query.isFetchingNextPage]);

  return {
    ...query,
    articles,
    loadNextPage,
    total: query.data?.pages[0]?.meta.total ?? 0,
  };
}
