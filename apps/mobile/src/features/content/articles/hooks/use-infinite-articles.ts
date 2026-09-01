import type { RouterInputs, RouterOutputs } from "@basango/api/trpc/routers/_app";
import { type InfiniteData, type QueryKey, useInfiniteQuery } from "@tanstack/react-query";
import { useCallback, useMemo } from "react";

import { useTRPC, useTRPCClient } from "#mobile/application/trpc/client";
import { getNextPage } from "#mobile/features/content/shared/get-next-page";

export const ARTICLES_PAGE_SIZE = 20;

type ArticleFilters = Omit<RouterInputs["public"]["articles"]["list"], "limit" | "page">;
type ArticlePage = RouterOutputs["public"]["articles"]["list"];

type UseInfiniteArticlesOptions = ArticleFilters & {
  enabled?: boolean;
};

export function useInfiniteArticles({
  categoryId,
  enabled = true,
  search,
  sourceId,
}: UseInfiniteArticlesOptions = {}) {
  const trpc = useTRPC();
  const trpcClient = useTRPCClient();
  const filters = { categoryId, search, sourceId };
  const queryKey = trpc.public.articles.list.queryKey({
    ...filters,
    limit: ARTICLES_PAGE_SIZE,
  });
  const query = useInfiniteQuery<
    ArticlePage,
    Error,
    InfiniteData<ArticlePage, number>,
    QueryKey,
    number
  >({
    enabled,
    getNextPageParam: (lastPage) => getNextPage(lastPage.meta),
    initialPageParam: 1,
    queryFn: async ({ pageParam, signal }): Promise<ArticlePage> =>
      trpcClient.public.articles.list.query(
        { ...filters, limit: ARTICLES_PAGE_SIZE, page: pageParam },
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
