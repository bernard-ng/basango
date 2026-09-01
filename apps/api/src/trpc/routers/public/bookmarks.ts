import {
  addArticleToBookmark,
  createBookmark,
  deleteBookmark,
  getArticleBookmarkMemberships,
  getBookmarkArticles,
  getBookmarks,
  removeArticleFromBookmark,
  updateBookmark,
} from "@basango/db/queries/public";
import {
  ArticleSchema,
  bookmarkArticleListSchema,
  bookmarkArticleSchema,
  bookmarkIdSchema,
  bookmarkListSchema,
  createBookmarkSchema,
  updateBookmarkSchema,
} from "@basango/domain/models/public";

import { createTRPCRouter, protectedProcedure } from "#api/trpc/init";

export const bookmarksRouter = createTRPCRouter({
  addArticle: protectedProcedure.input(bookmarkArticleSchema).mutation(async ({ ctx, input }) => {
    return addArticleToBookmark(ctx.db, ctx.session.user.id, input.bookmarkId, input.articleId);
  }),

  create: protectedProcedure.input(createBookmarkSchema).mutation(async ({ ctx, input }) => {
    return createBookmark(ctx.db, ctx.session.user.id, input);
  }),

  delete: protectedProcedure.input(bookmarkIdSchema).mutation(async ({ ctx, input }) => {
    return deleteBookmark(ctx.db, ctx.session.user.id, input.id);
  }),

  list: protectedProcedure.input(bookmarkListSchema).query(async ({ ctx, input }) => {
    return getBookmarks(ctx.db, ctx.session.user.id, input);
  }),

  listArticles: protectedProcedure
    .input(bookmarkArticleListSchema)
    .query(async ({ ctx, input }) => {
      return getBookmarkArticles(ctx.db, ctx.session.user.id, input);
    }),

  memberships: protectedProcedure.input(ArticleSchema).query(async ({ ctx, input }) => {
    return getArticleBookmarkMemberships(ctx.db, ctx.session.user.id, input.id);
  }),

  removeArticle: protectedProcedure
    .input(bookmarkArticleSchema)
    .mutation(async ({ ctx, input }) => {
      return removeArticleFromBookmark(
        ctx.db,
        ctx.session.user.id,
        input.bookmarkId,
        input.articleId,
      );
    }),

  update: protectedProcedure.input(updateBookmarkSchema).mutation(async ({ ctx, input }) => {
    return updateBookmark(ctx.db, ctx.session.user.id, input);
  }),
});
