import type { AppRouter } from "@basango/api/trpc/routers/_app";
import { DEFAULT_REFRESH_TOKEN_COOKIE } from "@basango/domain/constants";
import { createTRPCProxyClient, httpBatchLink } from "@trpc/client";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import superjson from "superjson";

const client = createTRPCProxyClient<AppRouter>({
  links: [
    httpBatchLink({
      transformer: superjson,
      url: `${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3080"}/trpc`,
    }),
  ],
});

export async function POST(request: NextRequest) {
  const cookieStore = await cookies();
  const refreshToken =
    cookieStore.get(DEFAULT_REFRESH_TOKEN_COOKIE)?.value ??
    (await getRefreshTokenFromBody(request));

  if (!refreshToken) {
    return NextResponse.json({ error: "Missing refresh token" }, { status: 401 });
  }

  try {
    const tokens = await client.auth.refresh.mutate({
      refreshToken,
    });

    return NextResponse.json(tokens);
  } catch {
    return NextResponse.json({ error: "Invalid refresh token" }, { status: 401 });
  }
}

async function getRefreshTokenFromBody(request: NextRequest) {
  try {
    const body = await request.json();
    if (typeof body?.refreshToken === "string") {
      return body.refreshToken;
    }
  } catch {
    // Ignore malformed bodies
  }

  return undefined;
}
