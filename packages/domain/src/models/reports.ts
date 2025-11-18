import { z } from "@hono/zod-openapi";

import { deltaSchema } from "#domain/models/shared";

export const overviewMetricSchema = z
  .object({
    delta: deltaSchema.openapi({
      description: "Change measured over the last 30 days compared to the previous 30-day window.",
    }),
    total: z.number().int().nonnegative().openapi({
      description: "Total count across the entire dataset.",
      example: 12584,
    }),
  })
  .openapi({
    description: "Aggregated metric with total count and delta metadata.",
  });

export const dashboardOverviewSchema = z
  .object({
    articles: overviewMetricSchema,
    sources: overviewMetricSchema,
    users: overviewMetricSchema,
  })
  .openapi({
    description: "Dashboard overview metrics for key entities.",
  });

export type OverviewMetric = z.infer<typeof overviewMetricSchema>;
export type DashboardOverview = z.infer<typeof dashboardOverviewSchema>;
