import {
  createSource,
  getSourceById,
  getSourceCategoryShares,
  getSourcePublicationGraph,
  getSources,
  updateSource,
} from "@basango/db/queries";

import { createSourceSchema, getSourceSchema, updateSourceSchema } from "#api/schemas/sources";
import { createTRPCRouter, protectedProcedure } from "#api/trpc/init";

export const sourcesRouter = createTRPCRouter({
  create: protectedProcedure.input(createSourceSchema).mutation(async ({ ctx, input }) => {
    return createSource(ctx.db, input);
  }),

  get: protectedProcedure.query(async ({ ctx }) => getSources(ctx.db)),

  getById: protectedProcedure.input(getSourceSchema).query(async ({ ctx, input }) => {
    return getSourceById(ctx.db, input.id);
  }),

  getCategoryShares: protectedProcedure.input(getSourceSchema).query(async ({ ctx, input }) => {
    return getSourceCategoryShares(ctx.db, input.id);
  }),

  getPublicationGraph: protectedProcedure.input(getSourceSchema).query(async ({ ctx, input }) => {
    return getSourcePublicationGraph(ctx.db, input.id);
  }),

  update: protectedProcedure.input(updateSourceSchema).mutation(async ({ ctx, input }) => {
    return updateSource(ctx.db, input);
  }),
});
