import { syncCrawlerSources } from "@basango/db/queries";
import { syncCrawlerSourcesResponseSchema, syncCrawlerSourcesSchema } from "@basango/domain/models";
import { logger } from "@basango/logger";
import { OpenAPIHono, createRoute } from "@hono/zod-openapi";

import type { Context } from "#api/rest/init";
import { withDatabase } from "#api/rest/middlewares/db";
import { withIngestionAuth } from "#api/rest/middlewares/ingestion";
import { searchSynchronizer } from "#api/search";
import { validateResponse } from "#api/utils/response";

const app = new OpenAPIHono<Context>();

app.openapi(
  createRoute({
    description:
      "Register configured crawler sources and update their archive-size estimates before crawling.",
    method: "post",
    middleware: [withIngestionAuth, withDatabase],
    operationId: "SyncCrawlerSources",
    path: "/",
    request: {
      body: {
        content: {
          "application/json": {
            schema: syncCrawlerSourcesSchema,
          },
        },
      },
    },
    responses: {
      200: {
        content: {
          "application/json": {
            schema: syncCrawlerSourcesResponseSchema,
          },
        },
        description: "Crawler sources synchronized",
      },
    },
    summary: "Synchronize crawler sources",
    tags: ["Ingestion"],
  }),
  async (c) => {
    const result = await syncCrawlerSources(c.get("db"), c.req.valid("json"));
    void searchSynchronizer.drainDirty().catch((error) => {
      logger.warn({ error }, "Crawler source search refresh deferred");
    });

    return c.json(validateResponse(result, syncCrawlerSourcesResponseSchema), 200);
  },
);

export const sourceSyncRouter = app;
