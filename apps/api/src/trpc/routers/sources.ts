import {
  createSource,
  getSourceById,
  getSourceCategoryShares,
  getSourcePublicationGraph,
  getSources,
  updateSource,
} from "@basango/db/queries";
import {
  createSourceSchema,
  getCategorySharesSchema,
  getPublicationsSchema,
  getSourceSchema,
  updateSourceSchema,
} from "@basango/domain/models";

import { createTRPCRouter, protectedProcedure } from "#api/trpc/init";

export const sourcesRouter = createTRPCRouter({
  create: protectedProcedure.input(createSourceSchema).mutation(async ({ ctx, input }) => {
    return createSource(ctx.db, input);
  }),

  getById: protectedProcedure.input(getSourceSchema).query(async ({ ctx, input }) => {
    return getSourceById(ctx.db, input.id);
  }),

  getCategoryShares: protectedProcedure
    .input(getCategorySharesSchema)
    .query(async ({ ctx, input }) => {
      return getSourceCategoryShares(ctx.db, input);
    }),

  getPublicationGraph: protectedProcedure
    .input(getPublicationsSchema)
    .query(async ({ ctx, input }) => {
      return getSourcePublicationGraph(ctx.db, input);
    }),

  list: protectedProcedure.query(async ({ ctx }) => getSources(ctx.db)),

  update: protectedProcedure.input(updateSourceSchema).mutation(async ({ ctx, input }) => {
    return updateSource(ctx.db, input);
  }),
});
