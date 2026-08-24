import { getDashboardOverview } from "@basango/db/queries";

import { adminProcedure, createTRPCRouter } from "#api/trpc/init";

export const reportsRouter = createTRPCRouter({
  getDashboardOverview: adminProcedure.query(async ({ ctx }) => {
    return getDashboardOverview(ctx.db);
  }),
});
