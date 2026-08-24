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

import { adminProcedure, createTRPCRouter } from "#api/trpc/init";

export const sourcesRouter = createTRPCRouter({
  create: adminProcedure.input(createSourceSchema).mutation(async ({ ctx, input }) => {
    return createSource(ctx.db, input);
  }),

  getById: adminProcedure.input(getSourceSchema).query(async ({ ctx, input }) => {
    return getSourceById(ctx.db, input.id);
  }),

  getCategoryShares: adminProcedure.input(getCategorySharesSchema).query(async ({ ctx, input }) => {
    return getSourceCategoryShares(ctx.db, input);
  }),

  getPublications: adminProcedure.input(getPublicationsSchema).query(async ({ ctx, input }) => {
    return getSourcePublicationGraph(ctx.db, input);
  }),

  list: adminProcedure.query(async ({ ctx }) => getSources(ctx.db)),

  update: adminProcedure.input(updateSourceSchema).mutation(async ({ ctx, input }) => {
    return updateSource(ctx.db, input);
  }),
});
