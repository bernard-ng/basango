import type { MiddlewareHandler } from "hono";
import { HTTPException } from "hono/http-exception";

import { auth, isAdmin } from "#api/auth";
import type { Context } from "#api/rest/init";

export const withAdminSession: MiddlewareHandler<Context> = async (c, next) => {
  const session = await auth.api.getSession({ headers: c.req.raw.headers });
  if (!session) {
    throw new HTTPException(401, { message: "Authentication required" });
  }
  if (!isAdmin(session)) {
    throw new HTTPException(403, { message: "Administrator access required" });
  }

  c.set("session", session);
  await next();
};
