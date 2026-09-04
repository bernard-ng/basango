import {
  createArticle,
  getArticleById,
  getArticles,
  getArticlesPublicationGraph,
  getArticlesSourceDistribution,
} from "@basango/db/queries";
import { config } from "@basango/domain/config";
import {
  createArticleSchema,
  getArticleSchema,
  getArticlesSchema,
  getDistributionsSchema,
  getPublicationsSchema,
  searchArticlesSchema,
} from "@basango/domain/models";
import { logger } from "@basango/logger";

import { searchSynchronizer } from "#api/search";
import { adminProcedure, createTRPCRouter } from "#api/trpc/init";

export const articlesRouter = createTRPCRouter({
  create: adminProcedure.input(createArticleSchema).mutation(async ({ ctx, input }) => {
    const result = await createArticle(ctx.db, input);

    if (result.created) {
      void searchSynchronizer.synchronizeArticle(result.id).catch((error) => {
        logger.warn({ articleId: result.id, error }, "Article search indexing deferred");
      });
    }

    return result;
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

  search: adminProcedure.input(searchArticlesSchema).query(async ({ ctx, input }) => {
    return ctx.searchEngine.search({
      ...input,
      limit: input.limit ?? config.shared.pagination.defaultLimit,
      page: input.page ?? config.shared.pagination.page,
    });
  }),
});
