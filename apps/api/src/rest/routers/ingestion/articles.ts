import { createArticle } from "@basango/db/queries";
import {
  articleHashSchema,
  createArticleResponseSchema,
  createArticleSchema,
} from "@basango/domain/models";
import { md5 } from "@basango/encryption";
import { OpenAPIHono, createRoute } from "@hono/zod-openapi";
import { HTTPException } from "hono/http-exception";
import { z } from "zod";

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
      headers: z.object({
        "idempotency-key": articleHashSchema,
      }),
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
    const payload = c.req.valid("json");
    const idempotencyKey = c.req.valid("header")["idempotency-key"];

    if (idempotencyKey !== payload.hash) {
      throw new HTTPException(400, {
        message: "Idempotency-Key must match the article hash",
      });
    }

    if (payload.hash !== md5(payload.link)) {
      throw new HTTPException(400, {
        message: "Article hash must be the MD5 identity of its link",
      });
    }

    const result = await createArticle(c.get("db"), payload);
    return c.json(validateResponse(result, createArticleResponseSchema), 201);
  },
);

export const articleIngestionRouter = app;
