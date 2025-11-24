import { OpenAPIHono } from "@hono/zod-openapi";

import { articlesRouter } from "#api/rest/routers/articles";
import { sourcesRouter } from "#api/rest/routers/sources";

const routers: OpenAPIHono = new OpenAPIHono();

routers.route("/articles", articlesRouter);
routers.route("/sources", sourcesRouter);

export { routers };
