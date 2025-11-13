import { createSource, getSourceById, getSources, updateSource } from "@basango/db/queries";

import { createSourceSchema, getSourceSchema, updateSourceSchema } from "@/schemas/sources";
import { createTRPCRouter, protectedProcedure } from "@/trpc/init";

export const sourcesRouter = createTRPCRouter({
  create: protectedProcedure.input(createSourceSchema).mutation(async ({ ctx, input }) => {
    return createSource(ctx.db, { ...input });
  }),

  get: protectedProcedure.query(async ({ ctx }) => getSources(ctx.db)),

  getById: protectedProcedure.input(getSourceSchema).query(async ({ ctx, input }) => {
    return getSourceById(ctx.db, input.id);
  }),

  update: protectedProcedure.input(updateSourceSchema).mutation(async ({ ctx, input }) => {
    return updateSource(ctx.db, { ...input });
  }),
});
