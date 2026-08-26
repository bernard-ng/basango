import { describe, expect, test } from "bun:test";

import { articleHashSchema, createArticleResponseSchema } from "./articles";

describe("article ingestion contracts", () => {
  test("accepts the crawler's lowercase MD5 article identity", () => {
    expect(articleHashSchema.parse("0123456789abcdef0123456789abcdef")).toBe(
      "0123456789abcdef0123456789abcdef",
    );
  });

  test("rejects malformed or uppercase article identities", () => {
    expect(articleHashSchema.safeParse("not-a-hash").success).toBeFalse();
    expect(articleHashSchema.safeParse("0123456789ABCDEF0123456789ABCDEF").success).toBeFalse();
  });

  test("reports whether an idempotent request inserted a row", () => {
    expect(
      createArticleResponseSchema.parse({
        created: false,
        id: "019c0000-0000-7000-8000-000000000001",
        sourceId: "019c0000-0000-7000-8000-000000000002",
      }),
    ).toEqual({
      created: false,
      id: "019c0000-0000-7000-8000-000000000001",
      sourceId: "019c0000-0000-7000-8000-000000000002",
    });
  });
});
