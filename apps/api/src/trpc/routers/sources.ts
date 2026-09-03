import {
  createSource,
  deleteSource,
  getSourceById,
  getSourceCategoryDistribution,
  getSourcePublicationGraph,
  getSources,
  updateSource,
} from "@basango/db/queries";
import {
  createSourceSchema,
  deleteSourceSchema,
  getCategoryDistributionSchema,
  getPublicationsSchema,
  getSourceSchema,
  getSourcesSchema,
  updateSourceSchema,
} from "@basango/domain/models";

import { adminProcedure, createTRPCRouter } from "#api/trpc/init";

export const sourcesRouter = createTRPCRouter({
  create: adminProcedure.input(createSourceSchema).mutation(async ({ ctx, input }) => {
    return createSource(ctx.db, input);
  }),

  delete: adminProcedure.input(deleteSourceSchema).mutation(async ({ ctx, input }) => {
    return deleteSource(ctx.db, input.id);
  }),

  getById: adminProcedure.input(getSourceSchema).query(async ({ ctx, input }) => {
    return getSourceById(ctx.db, input.id);
  }),

  getCategoryDistribution: adminProcedure
    .input(getCategoryDistributionSchema)
    .query(async ({ ctx, input }) => {
      return getSourceCategoryDistribution(ctx.db, input);
    }),

  getPublications: adminProcedure.input(getPublicationsSchema).query(async ({ ctx, input }) => {
    return getSourcePublicationGraph(ctx.db, input);
  }),

  list: adminProcedure.input(getSourcesSchema).query(async ({ ctx, input }) => {
    return getSources(ctx.db, input);
  }),

  update: adminProcedure.input(updateSourceSchema).mutation(async ({ ctx, input }) => {
    return updateSource(ctx.db, input);
  }),
});
