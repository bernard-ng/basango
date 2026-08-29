import {
  addReaderArticleToBookmark,
  createReaderBookmark,
  createReaderComment,
  deleteReaderBookmark,
  deleteReaderComment,
  followReaderSource,
  getReaderArticleById,
  getReaderArticles,
  getReaderBookmarkArticles,
  getReaderBookmarks,
  getReaderCategories,
  getReaderComments,
  getReaderSourceById,
  getReaderSources,
  removeReaderArticleFromBookmark,
  unfollowReaderSource,
  updateReaderBookmark,
} from "@basango/db/queries";
import {
  bookmarkArticleListSchema,
  bookmarkArticleSchema,
  bookmarkIdSchema,
  bookmarkListSchema,
  commentListSchema,
  createBookmarkSchema,
  createCommentSchema,
  deleteCommentSchema,
  readerArticleListSchema,
  readerArticleSchema,
  readerSourceListSchema,
  readerSourceSchema,
  updateBookmarkSchema,
} from "@basango/domain/models";

import { createTRPCRouter, protectedProcedure } from "#api/trpc/init";

const feedArticlesRouter = createTRPCRouter({
  get: protectedProcedure.input(readerArticleSchema).query(async ({ ctx, input }) => {
    return getReaderArticleById(ctx.db, input.id);
  }),

  list: protectedProcedure.input(readerArticleListSchema).query(async ({ ctx, input }) => {
    return getReaderArticles(ctx.db, input);
  }),
});

const feedBookmarksRouter = createTRPCRouter({
  addArticle: protectedProcedure.input(bookmarkArticleSchema).mutation(async ({ ctx, input }) => {
    return addReaderArticleToBookmark(
      ctx.db,
      ctx.session.user.id,
      input.bookmarkId,
      input.articleId,
    );
  }),

  create: protectedProcedure.input(createBookmarkSchema).mutation(async ({ ctx, input }) => {
    return createReaderBookmark(ctx.db, ctx.session.user.id, input);
  }),

  delete: protectedProcedure.input(bookmarkIdSchema).mutation(async ({ ctx, input }) => {
    return deleteReaderBookmark(ctx.db, ctx.session.user.id, input.id);
  }),

  list: protectedProcedure.input(bookmarkListSchema).query(async ({ ctx, input }) => {
    return getReaderBookmarks(ctx.db, ctx.session.user.id, input);
  }),

  listArticles: protectedProcedure
    .input(bookmarkArticleListSchema)
    .query(async ({ ctx, input }) => {
      return getReaderBookmarkArticles(ctx.db, ctx.session.user.id, input);
    }),

  removeArticle: protectedProcedure
    .input(bookmarkArticleSchema)
    .mutation(async ({ ctx, input }) => {
      return removeReaderArticleFromBookmark(
        ctx.db,
        ctx.session.user.id,
        input.bookmarkId,
        input.articleId,
      );
    }),

  update: protectedProcedure.input(updateBookmarkSchema).mutation(async ({ ctx, input }) => {
    return updateReaderBookmark(ctx.db, ctx.session.user.id, input);
  }),
});

const feedCategoriesRouter = createTRPCRouter({
  list: protectedProcedure.query(async ({ ctx }) => {
    return getReaderCategories(ctx.db);
  }),
});

const feedCommentsRouter = createTRPCRouter({
  create: protectedProcedure.input(createCommentSchema).mutation(async ({ ctx, input }) => {
    return createReaderComment(ctx.db, ctx.session.user.id, input);
  }),

  delete: protectedProcedure.input(deleteCommentSchema).mutation(async ({ ctx, input }) => {
    return deleteReaderComment(ctx.db, ctx.session.user.id, input.id);
  }),

  list: protectedProcedure.input(commentListSchema).query(async ({ ctx, input }) => {
    return getReaderComments(ctx.db, input);
  }),
});

const feedSourcesRouter = createTRPCRouter({
  follow: protectedProcedure.input(readerSourceSchema).mutation(async ({ ctx, input }) => {
    return followReaderSource(ctx.db, ctx.session.user.id, input.id);
  }),

  get: protectedProcedure.input(readerSourceSchema).query(async ({ ctx, input }) => {
    return getReaderSourceById(ctx.db, ctx.session.user.id, input.id);
  }),

  list: protectedProcedure.input(readerSourceListSchema).query(async ({ ctx, input }) => {
    return getReaderSources(ctx.db, ctx.session.user.id, input);
  }),

  unfollow: protectedProcedure.input(readerSourceSchema).mutation(async ({ ctx, input }) => {
    return unfollowReaderSource(ctx.db, ctx.session.user.id, input.id);
  }),
});

export const feedRouter = createTRPCRouter({
  articles: feedArticlesRouter,
  bookmarks: feedBookmarksRouter,
  categories: feedCategoriesRouter,
  comments: feedCommentsRouter,
  sources: feedSourcesRouter,
});
