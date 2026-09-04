import { getArticleById, getArticles } from "@basango/db/queries/public";
import { config } from "@basango/domain/config";
import {
  ArticleListSchema,
  ArticleSchema,
  ArticleSearchSchema,
} from "@basango/domain/models/public";

import { createTRPCRouter, protectedProcedure } from "#api/trpc/init";

export const articlesRouter = createTRPCRouter({
  get: protectedProcedure.input(ArticleSchema).query(async ({ ctx, input }) => {
    return getArticleById(ctx.db, input.id);
  }),

  list: protectedProcedure.input(ArticleListSchema).query(async ({ ctx, input }) => {
    return getArticles(ctx.db, input);
  }),

  search: protectedProcedure.input(ArticleSearchSchema).query(async ({ ctx, input }) => {
    return ctx.searchEngine.search({
      ...input,
      limit: input.limit ?? config.shared.pagination.defaultLimit,
      page: input.page ?? config.shared.pagination.page,
    });
  }),
});
