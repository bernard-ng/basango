import { endpoint } from "@/api/endpoint";
import { ArticleOverview } from "@/api/schema/feed-management/article";
import { SourceDetails, SourceOverview } from "@/api/schema/feed-management/source";
import { ArticleFilters, useDeleteQuery, useGetQuery, usePaginatedInfiniteQuery, usePostQuery } from "@/api/shared";

export const useSourceDetails = (sourceId: string) => {
    return useGetQuery<SourceDetails>(endpoint.feedManagement.getSourceDetails(sourceId));
};

export const useSourceOverviewList = (filters: ArticleFilters = {}) => {
    return usePaginatedInfiniteQuery<SourceOverview>(endpoint.feedManagement.getSourceOverviewList, filters);
};

export const useSourceArticleOverviewList = (sourceId: string, filters: ArticleFilters = {}) => {
    return usePaginatedInfiniteQuery<ArticleOverview>(
        endpoint.feedManagement.getSourceArticleOverviewList(sourceId),
        filters
    );
};

export const useFollowSource = (sourceId: string) => {
    return usePostQuery(endpoint.feedManagement.followSource(sourceId));
};

export const useUnfollowSource = (sourceId: string) => {
    return useDeleteQuery(endpoint.feedManagement.unfollowSource(sourceId));
};
