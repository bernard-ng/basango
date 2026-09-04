import { type Database, db } from "@basango/db/client";
import type { SearchEngine } from "@basango/search/engine";
import { TRPCError, initTRPC } from "@trpc/server";
import type { Context } from "hono";
import superjson from "superjson";

import { type AuthSession, auth, isAdmin } from "#api/auth";
import { searchEngine } from "#api/search";
import { withDatabase } from "#api/trpc/middlewares/db";
import { getGeoContext } from "#api/utils/geo";

type TRPCContext = {
  session: AuthSession | null;
  db: Database;
  geo: ReturnType<typeof getGeoContext>;
  searchEngine: SearchEngine;
};

export const createTRPCContext = async (_: unknown, c: Context): Promise<TRPCContext> => {
  const session = await auth.api.getSession({ headers: c.req.raw.headers });
  const geo = getGeoContext(c.req);

  return {
    db,
    geo,
    searchEngine,
    session,
  };
};

const t = initTRPC.context<TRPCContext>().create({
  transformer: superjson,
});

export const createTRPCRouter = t.router;
export const createCallerFactory = t.createCallerFactory;

const withDatabaseMiddleware = t.middleware(async (opts) => {
  return withDatabase({
    ctx: opts.ctx,
    next: opts.next,
  });
});

export const publicProcedure = t.procedure.use(withDatabaseMiddleware);

export const protectedProcedure = t.procedure.use(withDatabaseMiddleware).use(async (opts) => {
  const { session } = opts.ctx;

  if (!session) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }

  return opts.next({
    ctx: {
      session,
    },
  });
});

export const adminProcedure = protectedProcedure.use(async (opts) => {
  if (!isAdmin(opts.ctx.session)) {
    throw new TRPCError({ code: "FORBIDDEN", message: "Administrator access is required." });
  }

  return opts.next();
});
