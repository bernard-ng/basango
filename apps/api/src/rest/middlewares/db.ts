import { db } from "@basango/db/client";
import type { MiddlewareHandler } from "hono";

export const withDatabase: MiddlewareHandler = async (c, next) => {
  c.set("db", db);

  await next();
};
