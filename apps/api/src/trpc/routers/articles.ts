import {
  createArticle,
  getArticles,
  getArticlesPublicationGraph,
  getArticlesSourceDistribution,
} from "@basango/db/queries";
import {
  createArticleSchema,
  getArticlesSchema,
  getDistributionsSchema,
  getPublicationsSchema,
} from "@basango/domain/models";

import { createTRPCRouter, protectedProcedure } from "#api/trpc/init";

export const articlesRouter = createTRPCRouter({
  create: protectedProcedure.input(createArticleSchema).mutation(async ({ ctx, input }) => {
    return createArticle(ctx.db, input);
  }),

  getPublications: protectedProcedure.input(getPublicationsSchema).query(async ({ ctx, input }) => {
    return getArticlesPublicationGraph(ctx.db, input);
  }),

  getSourceDistribution: protectedProcedure
    .input(getDistributionsSchema)
    .query(async ({ ctx, input }) => {
      return getArticlesSourceDistribution(ctx.db, input);
    }),

  list: protectedProcedure.input(getArticlesSchema).query(async ({ ctx, input }) => {
    return getArticles(ctx.db, input);
  }),
});
