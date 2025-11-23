import { config } from "@basango/domain/config";
import { trpcServer } from "@hono/trpc-server";
import { OpenAPIHono } from "@hono/zod-openapi";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { secureHeaders } from "hono/secure-headers";

import { routers } from "#api/rest/routers";
import { createTRPCContext } from "#api/trpc/init";
import { appRouter } from "#api/trpc/routers/_app";

const app = new OpenAPIHono();

app.use(logger());
app.use(secureHeaders());

app.use(
  "*",
  cors({
    allowHeaders: config.api.cors.allowedHeaders,
    allowMethods: config.api.cors.allowMethods,
    exposeHeaders: config.api.cors.exposeHeaders,
    maxAge: config.api.cors.maxAge,
    origin: config.api.cors.origin,
  }),
);

app.use(
  "/trpc/*",
  trpcServer({
    createContext: createTRPCContext,
    router: appRouter,
  }),
);

app.route("/", routers);

export default {
  fetch: app.fetch,
  hostname: config.api.server.host,
  port: config.api.server.port,
};
