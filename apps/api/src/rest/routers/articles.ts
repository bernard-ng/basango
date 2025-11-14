import { createArticle } from "@basango/db/queries";
import { OpenAPIHono, createRoute } from "@hono/zod-openapi";

import { withCrawlerAuth } from "#api/rest/middlewares/crawler";
import { withDatabase } from "#api/rest/middlewares/db";
import type { Context } from "#api/rest/types";
import { createArticleResponseSchema, createArticleSchema } from "#api/schemas/articles";
import { validateResponse } from "#api/utils/response";

const app = new OpenAPIHono<Context>();

app.openapi(
  createRoute({
    description: "Store a new crawled article in the database.",
    method: "post",
    middleware: [withCrawlerAuth, withDatabase],
    operationId: "CreateArticle",
    path: "/",
    request: {
      body: {
        content: {
          "application/json": {
            schema: createArticleSchema,
          },
        },
      },
    },
    responses: {
      201: {
        content: {
          "application/json": {
            schema: createArticleResponseSchema,
          },
        },
        description: "Article created",
      },
    },
    summary: "Create Article",
    tags: ["Articles"],
    "x-speakeasy-name-override": "create",
  }),
  async (c) => {
    const db = c.get("db");
    const input = c.req.valid("json");
    const result = await createArticle(db, input);

    return c.json(
      validateResponse(result, createArticleResponseSchema) as { id: string; sourceId: string },
      201,
    );
  },
);

export const articlesRouter = app;
