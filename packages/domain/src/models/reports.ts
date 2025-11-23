import z from "zod";

import { deltaSchema } from "./shared";

export const overviewMetricSchema = z.object({
  delta: deltaSchema,
  total: z.number().int().nonnegative(),
});

export const dashboardOverviewSchema = z.object({
  articles: overviewMetricSchema,
  sources: overviewMetricSchema,
  users: overviewMetricSchema,
});

export type OverviewMetric = z.infer<typeof overviewMetricSchema>;
export type DashboardOverview = z.infer<typeof dashboardOverviewSchema>;
