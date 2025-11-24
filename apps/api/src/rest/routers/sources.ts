import { getEarliestPublished, getLatestPublished } from "@basango/db/queries";
import {
  getSourceUpdateDatesResponseSchema,
  getSourceUpdateDatesSchema,
} from "@basango/domain/models";
import { OpenAPIHono, createRoute } from "@hono/zod-openapi";

import type { Context } from "#api/rest/init";
import { withCrawlerAuth } from "#api/rest/middlewares/crawler";
import { withDatabase } from "#api/rest/middlewares/db";
import { validateResponse } from "#api/utils/response";

const app = new OpenAPIHono<Context>();

app.openapi(
  createRoute({
    description: "Get the latest and earliest published dates for articles from a specific source.",
    method: "post",
    middleware: [withCrawlerAuth, withDatabase],
    operationId: "GetSourceUpdateDates",
    path: "/update-dates",
    request: {
      body: {
        content: {
          "application/json": {
            schema: getSourceUpdateDatesSchema,
          },
        },
      },
    },
    responses: {
      200: {
        content: {
          "application/json": {
            schema: getSourceUpdateDatesResponseSchema,
          },
        },
        description: "Source update dates retrieved",
      },
    },
    summary: "Get Source Update Dates",
    tags: ["Sources"],
    "x-speakeasy-name-override": "getSourceUpdateDates",
  }),
  async (c) => {
    const db = c.get("db");
    const input = c.req.valid("json");

    const [latest, earliest] = await Promise.all([
      getLatestPublished(db, input.name),
      getEarliestPublished(db, input.name),
    ]);

    return c.json(validateResponse({ earliest, latest }, getSourceUpdateDatesResponseSchema), 200);
  },
);

export const sourcesRouter = app;
