import {
  createArticle,
  getArticleById,
  getArticles,
  getArticlesPublicationGraph,
  getArticlesSourceDistribution,
} from "@basango/db/queries";
import {
  createArticleSchema,
  getArticleSchema,
  getArticlesSchema,
  getDistributionsSchema,
  getPublicationsSchema,
} from "@basango/domain/models";

import { adminProcedure, createTRPCRouter } from "#api/trpc/init";

export const articlesRouter = createTRPCRouter({
  create: adminProcedure.input(createArticleSchema).mutation(async ({ ctx, input }) => {
    return createArticle(ctx.db, input);
  }),

  getById: adminProcedure.input(getArticleSchema).query(async ({ ctx, input }) => {
    return getArticleById(ctx.db, input.id);
  }),

  getPublications: adminProcedure.input(getPublicationsSchema).query(async ({ ctx, input }) => {
    return getArticlesPublicationGraph(ctx.db, input);
  }),

  getSourceDistribution: adminProcedure
    .input(getDistributionsSchema)
    .query(async ({ ctx, input }) => {
      return getArticlesSourceDistribution(ctx.db, input);
    }),

  list: adminProcedure.input(getArticlesSchema).query(async ({ ctx, input }) => {
    return getArticles(ctx.db, input);
  }),
});
