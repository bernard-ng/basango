import { endpoint } from "@/api/endpoint";
import { Article, ArticleOverview, TrendingArticle } from "@/api/schema/feed-management/article";
import { ArticleFilters, useGetQuery, usePaginatedInfiniteQuery, usePaginatedQuery } from "@/api/shared";

export const useArticleTrendingList = (filters: ArticleFilters = {}) => {
    return usePaginatedQuery<TrendingArticle>("/feed/trending", filters);
};

export const useArticleDetails = (articleId: string) => {
    return useGetQuery<Article>(endpoint.feedManagement.getArticleDetails(articleId));
};

export const useArticleOverviewList = (filters: ArticleFilters = {}) => {
    return usePaginatedQuery<ArticleOverview>(endpoint.feedManagement.getArticleOverviewList, filters);
};

export const useInfiniteArticleOverviewList = (filters: ArticleFilters = {}) => {
    return usePaginatedInfiniteQuery<ArticleOverview>(endpoint.feedManagement.getArticleOverviewList, filters);
};
