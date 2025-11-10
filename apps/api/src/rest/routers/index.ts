import { OpenAPIHono } from "@hono/zod-openapi";

import { articlesRouter } from "@/rest/routers/articles";

const routers = new OpenAPIHono();

routers.route("/articles", articlesRouter);

export { routers };
