import { OpenAPIHono } from "@hono/zod-openapi";
import { Scalar } from "@scalar/hono-api-reference";
import { cors } from "hono/cors";
import { secureHeaders } from "hono/secure-headers";

import { checkHealth } from "@/utils/health";

const app = new OpenAPIHono();

app.use(secureHeaders());

app.use(
  "*",
  cors({
    allowHeaders: [
      "Authorization",
      "Content-Type",
      "accept-language",
      "x-trpc-source",
      "x-user-locale",
      "x-user-timezone",
      "x-user-country",
    ],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    exposeHeaders: ["Content-Length"],
    maxAge: 86400,
    origin: process.env.BASANGO_API_ALLOWED_ORIGINS?.split(",") ?? [],
  }),
);

app.get("/health", async (c) => {
  try {
    await checkHealth();

    return c.json({ status: "ok" }, 200);
  } catch (error) {
    return c.json(
      {
        message: error instanceof Error ? error.message : "Unknown error",
        status: "error",
      },
      500,
    );
  }
});

app.doc("/openapi", {
  info: {
    contact: {
      email: "engineer@basango.io",
      name: "Basango",
      url: "https://basango.io",
    },
    description: "Basango is a platform that leverages AI to revolutionize news curation.",
    license: {
      name: "AGPL-3.0 license",
      url: "https://github.com/midday-ai/midday/blob/main/LICENSE",
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
  "x-speakeasy-example": "BASANGO_API_KEY",
});

app.get("/", Scalar({ pageTitle: "Basango API", theme: "saturn", url: "/openapi" }));
