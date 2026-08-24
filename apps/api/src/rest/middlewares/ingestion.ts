import { config } from "@basango/domain/config";
import type { MiddlewareHandler } from "hono";
import { HTTPException } from "hono/http-exception";

export const withIngestionAuth: MiddlewareHandler = async (c, next) => {
  const token = c.req.header("Authorization");

  if (!token) {
    throw new HTTPException(401, { message: "Authorization header required" });
  }

  if (token !== config.api.security.ingestionToken) {
    throw new HTTPException(403, { message: "Invalid ingestion token" });
  }

  await next();
};
