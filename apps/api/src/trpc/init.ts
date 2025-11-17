import { Database, db } from "@basango/db/client";
import { TRPCError, initTRPC } from "@trpc/server";
import type { Context } from "hono";
import superjson from "superjson";

import { withAuthentication } from "#api/trpc/middlewares/auth";
import { withDatabase } from "#api/trpc/middlewares/db";
import { Session, getSession } from "#api/utils/auth";
import { getGeoContext } from "#api/utils/geo";

type TRPCContext = {
  session: Session | null;
  db: Database;
  geo: ReturnType<typeof getGeoContext>;
};

export const createTRPCContext = async (_: unknown, c: Context): Promise<TRPCContext> => {
  const accessToken = c.req.header("Authorization")?.split(" ")[1];
  const session = await getSession(db, accessToken);
  const geo = getGeoContext(c.req);

  return {
    db,
    geo,
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

const withAutenticationMiddleware = t.middleware(async (opts) => {
  return withAuthentication({
    ctx: opts.ctx,
    next: opts.next,
  });
});

export const publicProcedure = t.procedure.use(withDatabaseMiddleware);

export const protectedProcedure = t.procedure
  .use(withDatabaseMiddleware)
  .use(withAutenticationMiddleware)
  .use(async (opts) => {
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
