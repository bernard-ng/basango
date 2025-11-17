import { getUserByEmail, getUserById } from "@basango/db/queries";
import { loginSchema, refreshSessionSchema } from "@basango/domain/models";
import { verifyPassword } from "@basango/encryption";
import { TRPCError } from "@trpc/server";

import { createTRPCRouter, protectedProcedure, publicProcedure } from "#api/trpc/init";
import { createSessionTokens, verifyRefreshToken } from "#api/utils/auth";

export const authRouter = createTRPCRouter({
  login: publicProcedure.input(loginSchema).mutation(async ({ ctx, input }) => {
    const user = await getUserByEmail(ctx.db, input.email);

    if (!user || user.isLocked) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "Invalid credentials.",
      });
    }

    const isValidPassword = await verifyPassword(input.password, user.password);

    if (!isValidPassword) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "Invalid credentials.",
      });
    }

    const session = {
      user: {
        email: user.email,
        id: user.id,
        name: user.name,
      },
    };

    const tokens = await createSessionTokens(session);

    return {
      ...tokens,
      user: session.user,
    };
  }),

  refresh: publicProcedure.input(refreshSessionSchema).mutation(async ({ ctx, input }) => {
    const session = await verifyRefreshToken(input.refreshToken);

    if (!session) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "Invalid refresh token.",
      });
    }

    const user = await getUserById(ctx.db, {
      email: session.user.email,
      id: session.user.id,
    });

    if (!user || user.isLocked) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "Invalid refresh token.",
      });
    }

    const tokens = await createSessionTokens({
      user: {
        email: user.email,
        id: user.id,
        name: user.name,
      },
    });

    return {
      ...tokens,
      user: {
        email: user.email,
        id: user.id,
        name: user.name,
      },
    };
  }),

  session: protectedProcedure.query(({ ctx }) => ctx.session.user),
});
