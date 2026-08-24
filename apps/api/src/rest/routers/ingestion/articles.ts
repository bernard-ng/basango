import { createArticle } from "@basango/db/queries";
import { createArticleResponseSchema, createArticleSchema } from "@basango/domain/models";
import { OpenAPIHono, createRoute } from "@hono/zod-openapi";

import type { Context } from "#api/rest/init";
import { withDatabase } from "#api/rest/middlewares/db";
import { withIngestionAuth } from "#api/rest/middlewares/ingestion";
import { validateResponse } from "#api/utils/response";

const app = new OpenAPIHono<Context>();

app.openapi(
  createRoute({
    description: "Add a collected article to Basango's canonical dataset.",
    method: "post",
    middleware: [withIngestionAuth, withDatabase],
    operationId: "IngestArticle",
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
        description: "Article ingested",
      },
    },
    summary: "Ingest article",
    tags: ["Ingestion"],
  }),
  async (c) => {
    const result = await createArticle(c.get("db"), c.req.valid("json"));
    return c.json(validateResponse(result, createArticleResponseSchema), 201);
  },
);

export const articleIngestionRouter = app;
