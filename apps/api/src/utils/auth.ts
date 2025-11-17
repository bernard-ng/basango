import { Database } from "@basango/db/client";
import { getUserById } from "@basango/db/queries";
import {
  DEFAULT_ACCESS_TOKEN_TTL,
  DEFAULT_REFRESH_TOKEN_TTL,
  DEFAULT_TOKEN_AUDIENCE,
  DEFAULT_TOKEN_ISSUER,
} from "@basango/domain/constants";
import { type JWTPayload, SignJWT, jwtVerify } from "jose";

import { env } from "#api/config";

export type Session = {
  user: {
    id: string;
    email: string;
    name?: string;
  };
};

export type VerifiedJWTPayload = JWTPayload & {
  tokenType: TokenType;
  user: {
    id: string;
    email: string;
    name?: string;
  };
};

type TokenType = "access" | "refresh";

export type SessionTokens = {
  accessToken: string;
  refreshToken: string;
  accessTokenExpiresAt: string;
  refreshTokenExpiresAt: string;
};

const encoder = new TextEncoder();

function getSecretKey() {
  return encoder.encode(env("BASANGO_JWT_SECRET"));
}

export async function getSession(db: Database, accessToken?: string): Promise<Session | null> {
  const session = await verifyAccessToken(accessToken);

  if (!session) {
    return null;
  }

  const user = await getUserById(db, {
    email: session.user.email,
    id: session.user.id,
  });

  if (!user || user.isLocked) {
    return null;
  }

  return {
    user: {
      email: user.email,
      id: user.id,
      name: user.name,
    },
  };
}

async function createToken(session: Session, tokenType: TokenType, expiresIn: string) {
  return new SignJWT({
    tokenType,
    user: session.user,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setAudience(DEFAULT_TOKEN_AUDIENCE)
    .setIssuer(DEFAULT_TOKEN_ISSUER)
    .setExpirationTime(expiresIn)
    .sign(getSecretKey());
}

export async function createSessionTokens(session: Session): Promise<SessionTokens> {
  const [accessToken, refreshToken] = await Promise.all([
    createToken(session, "access", DEFAULT_ACCESS_TOKEN_TTL),
    createToken(session, "refresh", DEFAULT_REFRESH_TOKEN_TTL),
  ]);

  const issuedAt = Date.now();
  const accessTokenExpiresAt = new Date(
    issuedAt + formatTTL(DEFAULT_ACCESS_TOKEN_TTL),
  ).toISOString();
  const refreshTokenExpiresAt = new Date(
    issuedAt + formatTTL(DEFAULT_REFRESH_TOKEN_TTL),
  ).toISOString();

  return {
    accessToken,
    accessTokenExpiresAt,
    refreshToken,
    refreshTokenExpiresAt,
  };
}

export async function verifyAccessToken(accessToken?: string): Promise<Session | null> {
  return verifyToken(accessToken, "access");
}

export async function verifyRefreshToken(refreshToken?: string): Promise<Session | null> {
  return verifyToken(refreshToken, "refresh");
}

async function verifyToken(
  token: string | undefined,
  expectedType: TokenType,
): Promise<Session | null> {
  if (!token) return null;

  try {
    const { payload } = await jwtVerify<VerifiedJWTPayload>(token, getSecretKey(), {
      audience: DEFAULT_TOKEN_AUDIENCE,
      issuer: DEFAULT_TOKEN_ISSUER,
    });

    if (payload.tokenType !== expectedType) {
      return null;
    }

    return {
      user: {
        email: payload.user.email,
        id: payload.user.id,
        name: payload.user.name,
      },
    };
  } catch (_error: unknown) {
    return null;
  }
}

function formatTTL(ttl: string) {
  const match = ttl.match(/^(\d+)([smhd])$/);
  if (!match) return 0;
  const [, rawValue, rawUnit] = match;
  if (!rawValue || !rawUnit) {
    return 0;
  }
  const value = Number.parseInt(rawValue, 10);
  const multipliers = {
    d: 86_400_000,
    h: 3_600_000,
    m: 60_000,
    s: 1_000,
  } as const;
  const unit = rawUnit as keyof typeof multipliers;
  return value * (multipliers[unit] ?? 1_000);
}
