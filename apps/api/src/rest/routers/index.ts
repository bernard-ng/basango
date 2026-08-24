import { OpenAPIHono } from "@hono/zod-openapi";

import { ingestionRouter } from "#api/rest/routers/ingestion";
import { operationsRouter } from "#api/rest/routers/operations";

const routers: OpenAPIHono = new OpenAPIHono();

routers.route("/ingest", ingestionRouter);
routers.route("/operations", operationsRouter);

export { routers };
