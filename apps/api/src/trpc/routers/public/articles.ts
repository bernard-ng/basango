import { getArticleById, getArticles } from "@basango/db/queries/public";
import { ArticleListSchema, ArticleSchema } from "@basango/domain/models/public";

import { createTRPCRouter, protectedProcedure } from "#api/trpc/init";

export const articlesRouter = createTRPCRouter({
  get: protectedProcedure.input(ArticleSchema).query(async ({ ctx, input }) => {
    return getArticleById(ctx.db, input.id);
  }),

  list: protectedProcedure.input(ArticleListSchema).query(async ({ ctx, input }) => {
    return getArticles(ctx.db, input);
  }),
});
