import { endpoint } from "@/api/endpoint";
import { Comment, CommentPayload } from "@/api/schema/feed-management/comment";
import { useDeleteQuery, usePaginatedInfiniteQuery, usePostQuery } from "@/api/shared";

export const useArticleCommentList = (articleId: string) => {
    return usePaginatedInfiniteQuery<Comment>(endpoint.feedManagement.getArticleCommentList(articleId));
};

export const useAddCommentToArticle = (articleId: string) => {
    return usePostQuery<CommentPayload>(endpoint.feedManagement.addCommentToArticle(articleId));
};

export const useRemoveCommentFromArticle = (articleId: string, commentId: string) => {
    return useDeleteQuery(endpoint.feedManagement.removeArticleFromBookmark(articleId, commentId));
};
