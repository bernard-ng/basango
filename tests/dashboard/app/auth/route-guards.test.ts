import { describe, expect, test } from "bun:test";

import { hasAdminSession } from "../../../../apps/dashboard/src/app/auth/route-guards";

describe("dashboard route guards", () => {
  test("treats an unavailable authentication API as an unauthenticated session", async () => {
    const isAdmin = await hasAdminSession(async () => {
      throw new TypeError("Failed to fetch");
    });

    expect(isAdmin).toBe(false);
  });
});
