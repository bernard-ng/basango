import type { MiddlewareHandler } from "hono";

import type { Scope } from "@/utils/scopes";

export const withRequiredScope = (...requiredScopes: Scope[]): MiddlewareHandler => {
  return async (c, next) => {
    const scopes = c.get("scopes") as Scope[] | undefined;

    if (!scopes) {
      return c.json(
        {
          description: "No scopes found for the current user. Authentication is required.",
          error: "Unauthorized",
        },
        401,
      );
    }

    // Check if user has at least one of the required scopes
    const hasRequiredScope = requiredScopes.some((requiredScope) => scopes.includes(requiredScope));

    if (!hasRequiredScope) {
      return c.json(
        {
          description: `Insufficient permissions. Required scopes: ${requiredScopes.join(
            ", ",
          )}. Your scopes: ${scopes.join(", ")}`,
          error: "Forbidden",
        },
        403,
      );
    }

    await next();
  };
};
