import type { Database } from "@basango/db/client";

// import { TRPCError } from "@trpc/server";

import type { Session } from "@/utils/auth";

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

  //   const userId = ctx.session?.user?.id;

  //   if (!userId) {
  //     throw new TRPCError({
  //       code: "UNAUTHORIZED",
  //       message: "No permission to access",
  //     });
  //   }

  return next({
    ctx: {
      db: ctx.db,
      session: ctx.session,
    },
  });
};
