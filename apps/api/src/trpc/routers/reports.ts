import { getDashboardOverview } from "@basango/db/queries";

import { createTRPCRouter, protectedProcedure } from "#api/trpc/init";

export const reportsRouter = createTRPCRouter({
  getDashboardOverview: protectedProcedure.query(async ({ ctx }) => {
    return getDashboardOverview(ctx.db);
  }),
});
