import { OpenAPIHono } from "@hono/zod-openapi";

import { ingestionOperationsRouter } from "./ingestion";

const app = new OpenAPIHono();
app.route("/ingestion", ingestionOperationsRouter);

export const operationsRouter = app;
