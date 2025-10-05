import { endpoint } from "@/api/endpoint";
import { Bookmark, BookmarkedArticle, BookmarkPayload } from "@/api/schema/feed-management/bookmark";
import { ArticleFilters, useDeleteQuery, usePaginatedInfiniteQuery, usePostQuery, usePutQuery } from "@/api/shared";

export const useCreateBookmark = () => {
    return usePostQuery<BookmarkPayload>(endpoint.feedManagement.createBookmark);
};

export const useUpdateBookmark = (bookmarkId: string) => {
    return usePutQuery<BookmarkPayload>(endpoint.feedManagement.updateBookmark(bookmarkId));
};

export const useDeleteBookmark = (bookmarkId: string) => {
    return useDeleteQuery(endpoint.feedManagement.deleteBookmark(bookmarkId));
};

export const useAddArticleToBookmark = (bookmarkId: string, articleId: string) => {
    return usePostQuery(endpoint.feedManagement.addArticleToBookmark(bookmarkId, articleId));
};

export const useRemoveArticleFromBookmark = (bookmarkId: string, articleId: string) => {
    return useDeleteQuery(endpoint.feedManagement.removeArticleFromBookmark(bookmarkId, articleId));
};

export const useBookmarkList = (filters: ArticleFilters = {}) => {
    return usePaginatedInfiniteQuery<Bookmark>(endpoint.feedManagement.getBookmarkList, filters);
};

export const useBookmarkedArticlesList = (bookmarkId: string, filters: ArticleFilters = {}) => {
    return usePaginatedInfiniteQuery<BookmarkedArticle>(
        endpoint.feedManagement.getBookmarkedArticlesList(bookmarkId),
        filters
    );
};
