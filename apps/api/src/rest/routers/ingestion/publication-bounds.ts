import { getSourcePublicationBounds } from "@basango/db/queries";
import {
  getSourcePublicationBoundsResponseSchema,
  getSourcePublicationBoundsSchema,
} from "@basango/domain/models";
import { OpenAPIHono, createRoute } from "@hono/zod-openapi";

import type { Context } from "#api/rest/init";
import { withDatabase } from "#api/rest/middlewares/db";
import { withIngestionAuth } from "#api/rest/middlewares/ingestion";
import { validateResponse } from "#api/utils/response";

const app = new OpenAPIHono<Context>();

app.openapi(
  createRoute({
    description: "Get the current publication boundaries for one source.",
    method: "post",
    middleware: [withIngestionAuth, withDatabase],
    operationId: "GetSourcePublicationBounds",
    path: "/",
    request: {
      body: {
        content: {
          "application/json": {
            schema: getSourcePublicationBoundsSchema,
          },
        },
      },
    },
    responses: {
      200: {
        content: {
          "application/json": {
            schema: getSourcePublicationBoundsResponseSchema,
          },
        },
        description: "Publication boundaries retrieved",
      },
    },
    summary: "Get source publication boundaries",
    tags: ["Ingestion"],
  }),
  async (c) => {
    const { name } = c.req.valid("json");
    const bounds = await getSourcePublicationBounds(c.get("db"), name);

    return c.json(validateResponse(bounds, getSourcePublicationBoundsResponseSchema), 200);
  },
);

export const publicationBoundsRouter = app;
