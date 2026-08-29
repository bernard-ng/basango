import {
  createCategory,
  deleteCategory,
  getCategories,
  getClusteringStats,
  updateCategory,
} from "@basango/db/queries";
import {
  createCategorySchema,
  deleteCategorySchema,
  updateCategorySchema,
} from "@basango/domain/models";

import { adminProcedure, createTRPCRouter } from "#api/trpc/init";

export const categoriesRouter = createTRPCRouter({
  create: adminProcedure.input(createCategorySchema).mutation(async ({ ctx, input }) => {
    return createCategory(ctx.db, input);
  }),

  delete: adminProcedure.input(deleteCategorySchema).mutation(async ({ ctx, input }) => {
    return deleteCategory(ctx.db, input.id);
  }),

  list: adminProcedure.query(async ({ ctx }) => getCategories(ctx.db)),

  stats: adminProcedure.query(async ({ ctx }) => getClusteringStats(ctx.db)),

  update: adminProcedure.input(updateCategorySchema).mutation(async ({ ctx, input }) => {
    return updateCategory(ctx.db, input);
  }),
});
