import type { MiddlewareHandler } from "hono";
import { HTTPException } from "hono/http-exception";

import { env } from "#api/config";

export const withCrawlerAuth: MiddlewareHandler = async (c, next) => {
  const token = c.req.header("Authorization");

  if (!token) {
    throw new HTTPException(401, { message: "Authorization header required" });
  }

  if (token !== env("BASANGO_CRAWLER_TOKEN")) {
    throw new HTTPException(403, { message: "Invalid token" });
  }

  await next();
};
