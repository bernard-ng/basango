import { ingestionSignalAcceptedSchema, ingestionSignalSchema } from "@basango/domain/models";
import { OpenAPIHono, createRoute } from "@hono/zod-openapi";

import type { Context } from "#api/rest/init";
import { withDatabase } from "#api/rest/middlewares/db";
import { withIngestionAuth } from "#api/rest/middlewares/ingestion";
import { acceptIngestionSignal } from "#api/services/ingestion/signals";
import { validateResponse } from "#api/utils/response";

const app = new OpenAPIHono<Context>();

app.openapi(
  createRoute({
    description: "Project an idempotent ingestion lifecycle signal into the operations read model.",
    method: "post",
    middleware: [withIngestionAuth, withDatabase],
    operationId: "AcceptIngestionSignal",
    path: "/",
    request: {
      body: {
        content: {
          "application/json": {
            schema: ingestionSignalSchema,
          },
        },
      },
    },
    responses: {
      202: {
        content: {
          "application/json": {
            schema: ingestionSignalAcceptedSchema,
          },
        },
        description: "Signal accepted",
      },
    },
    summary: "Accept ingestion signal",
    tags: ["Ingestion"],
  }),
  async (c) => {
    const result = await acceptIngestionSignal(c.get("db"), c.req.valid("json"));
    return c.json(
      validateResponse(
        { accepted: true as const, duplicate: result.duplicate },
        ingestionSignalAcceptedSchema,
      ),
      202,
    );
  },
);

export const ingestionSignalsRouter = app;
