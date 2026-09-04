import { describe, expect, test } from "bun:test";

import {
  articleHashSchema,
  createArticleResponseSchema,
  getArticlesSchema,
  searchArticlesSchema,
} from "../../../packages/domain/src/models/articles";

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

describe("article list contracts", () => {
  test("accepts offset pagination", () => {
    const query = getArticlesSchema.parse({ limit: 24, page: 3 });

    expect(query).toMatchObject({ limit: 24, page: 3 });
  });

  test("rejects zero-based pages and cursor pagination", () => {
    expect(getArticlesSchema.safeParse({ page: 0 }).success).toBeFalse();
    expect(getArticlesSchema.safeParse({ cursor: "legacy-cursor" }).success).toBeFalse();
  });

  test("keeps text search on its dedicated contract", () => {
    expect(getArticlesSchema.safeParse({ search: "Goma" }).success).toBeFalse();
    expect(searchArticlesSchema.parse({ query: "  Goma  " }).query).toBe("Goma");
    expect(searchArticlesSchema.safeParse({ query: "   " }).success).toBeFalse();
  });
});
