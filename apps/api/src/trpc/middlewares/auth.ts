import type { Database } from "@basango/db/client";
import { TRPCError } from "@trpc/server";

import type { Session } from "#api/utils/auth";

export const withAuthentication = async <TReturn>(opts: {
  ctx: {
    session?: Session | null;
    db: Database;
  };
  next: (opts: {
    ctx: {
      session?: Session | null;
      db: Database;
    };
  }) => Promise<TReturn>;
}) => {
  const { ctx, next } = opts;

  if (!ctx.session) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "Authentication is required to access this resource.",
    });
  }

  return next({
    ctx: {
      db: ctx.db,
      session: ctx.session,
    },
  });
};
