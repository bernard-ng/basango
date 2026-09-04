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
import { logger } from "@basango/logger";

import { searchSynchronizer } from "#api/search";
import { adminProcedure, createTRPCRouter } from "#api/trpc/init";

export const categoriesRouter = createTRPCRouter({
  create: adminProcedure.input(createCategorySchema).mutation(async ({ ctx, input }) => {
    return createCategory(ctx.db, input);
  }),

  delete: adminProcedure.input(deleteCategorySchema).mutation(async ({ ctx, input }) => {
    const result = await deleteCategory(ctx.db, input.id);
    void searchSynchronizer.drainDirty().catch((error) => {
      logger.warn({ categoryId: input.id, error }, "Category search refresh deferred");
    });

    return result;
  }),

  list: adminProcedure.query(async ({ ctx }) => getCategories(ctx.db)),

  stats: adminProcedure.query(async ({ ctx }) => getClusteringStats(ctx.db)),

  update: adminProcedure.input(updateCategorySchema).mutation(async ({ ctx, input }) => {
    const result = await updateCategory(ctx.db, input);
    void searchSynchronizer.synchronizeCategory(input.id).catch((error) => {
      logger.warn({ categoryId: input.id, error }, "Category search refresh deferred");
    });

    return result;
  }),
});
