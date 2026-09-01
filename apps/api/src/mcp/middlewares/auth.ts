import { createHash, timingSafeEqual } from "node:crypto";

import { config } from "#domain/config";

type McpRequestHandler = (request: Request) => Response | Promise<Response>;

export function withMcpAuth(handler: McpRequestHandler): McpRequestHandler {
  return async (request) => {
    const token = readBearerToken(request.headers);

    if (!token || !tokensMatch(token, config.api.security.mcpToken)) {
      return unauthorizedResponse();
    }

    return await handler(request);
  };
}

function readBearerToken(headers: Headers) {
  const authorization = headers.get("authorization")?.trim();

  if (!authorization) {
    return null;
  }

  const [scheme, token, extra] = authorization.split(/\s+/);
  if (scheme?.toLowerCase() !== "bearer" || !token || extra) {
    return null;
  }

  return token;
}

function tokensMatch(token: string, expectedToken: string) {
  return timingSafeEqual(tokenDigest(token), tokenDigest(expectedToken));
}

function unauthorizedResponse() {
  return Response.json(
    {
      error: "invalid_token",
      error_description: "A valid Basango MCP bearer token is required.",
    },
    {
      headers: {
        "Cache-Control": "no-store",
        "WWW-Authenticate": 'Bearer realm="basango-mcp"',
      },
      status: 401,
    },
  );
}

function tokenDigest(token: string) {
  return createHash("sha256").update(token, "utf8").digest();
}
