import { type JWTPayload, jwtVerify } from "jose";

import { env } from "#api/config";

export type Session = {
  user: {
    id: string;
    email: string;
    full_name?: string;
  };
};

export type VerifiedJWTPayload = JWTPayload & {
  user: {
    id: string;
    email: string;
    full_name?: string;
  };
};

export async function verifyAccessToken(accessToken?: string): Promise<Session | null> {
  if (!accessToken) return null;

  try {
    const { payload } = await jwtVerify<VerifiedJWTPayload>(
      accessToken,
      new TextEncoder().encode(env("BASANGO_JWT_SECRET")),
    );

    return {
      user: {
        email: payload.user.email,
        full_name: payload.user.full_name,
        id: payload.user.id,
      },
    };
  } catch (_error: unknown) {
    return null;
  }
}
