import { trpcServer } from "@hono/trpc-server";
import { OpenAPIHono } from "@hono/zod-openapi";
import { Scalar } from "@scalar/hono-api-reference";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { secureHeaders } from "hono/secure-headers";

import { config, env } from "#api/config";
import { routers } from "#api/rest/routers";
import { createTRPCContext } from "#api/trpc/init";
import { appRouter } from "#api/trpc/routers/_app";

const app = new OpenAPIHono();

app.use(logger());
app.use(secureHeaders());

app.use(
  "*",
  cors({
    allowHeaders: config.cors.allowedHeaders,
    allowMethods: config.cors.allowMethods,
    exposeHeaders: config.cors.exposeHeaders,
    maxAge: config.cors.maxAge,
    origin: ["http://localhost:3000", "http://127.0.0.1:3000", "https://dashboard.basango.io"],
  }),
);

app.use(
  "/trpc/*",
  trpcServer({
    createContext: createTRPCContext,
    router: appRouter,
  }),
);

app.doc("/openapi", {
  info: {
    contact: {
      email: "engineering@basango.io",
      name: "Basango",
      url: "https://basango.io",
    },
    description: "Basango is a platform that leverages AI to revolutionize news curation.",
    license: {
      name: "AGPL-3.0 license",
      url: "https://github.com/bernard-ng/basango/blob/main/LICENSE",
    },
    title: "Basango API",
    version: "0.0.1",
  },
  openapi: "3.1.0",
  security: [
    {
      oauth2: [],
    },
    { token: [] },
  ],
  servers: [
    {
      description: "Production API",
      url: "https://api.basango.io",
    },
  ],
});

// Register security scheme
app.openAPIRegistry.registerComponent("securitySchemes", "token", {
  description: "Default authentication mechanism",
  scheme: "bearer",
  type: "http",
  "x-speakeasy-example": env("BASANGO_API_KEY"),
});

app.get("/", Scalar({ pageTitle: "Basango API", theme: "saturn", url: "/openapi" }));
app.route("/", routers);

export default {
  fetch: app.fetch,
  hostname: config.server.host,
  port: config.server.port,
};
