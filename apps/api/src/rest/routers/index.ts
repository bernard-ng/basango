import { OpenAPIHono } from "@hono/zod-openapi";

import { articlesRouter } from "#api/rest/routers/articles";

const routers: OpenAPIHono = new OpenAPIHono();

routers.route("/articles", articlesRouter);

export { routers };
