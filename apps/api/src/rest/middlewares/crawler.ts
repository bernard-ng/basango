import { config } from "@basango/domain/config";
import type { MiddlewareHandler } from "hono";
import { HTTPException } from "hono/http-exception";

export const withCrawlerAuth: MiddlewareHandler = async (c, next) => {
  const token = c.req.header("Authorization");

  if (!token) {
    throw new HTTPException(401, { message: "Authorization header required" });
  }

  if (token !== config.api.security.crawlerToken) {
    throw new HTTPException(403, { message: "Invalid token" });
  }

  await next();
};
