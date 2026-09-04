import { describe, expect, test } from "bun:test";

import {
  ArticleListSchema,
  ArticleSearchSchema,
  SourceListSchema,
  createBookmarkSchema,
  createCommentSchema,
  updateBookmarkSchema,
} from "../../../packages/domain/src/models/public";

const id = "0198f0e2-5c2d-7bba-ae95-3d7eae12b2bc";

describe("public schemas", () => {
  test("accepts bounded article filters", () => {
    const publishedAfter = "2026-09-01T00:00:00+02:00";
    const publishedBefore = "2026-09-01T23:59:59.999+02:00";

    expect(
      ArticleListSchema.parse({
        limit: 20,
        page: 1,
        publishedAfter,
        publishedBefore,
        sourceId: id,
      }),
    ).toMatchObject({
      limit: 20,
      page: 1,
      publishedAfter: new Date(publishedAfter),
      publishedBefore: new Date(publishedBefore),
      sourceId: id,
    });
    expect(SourceListSchema.parse({ followedOnly: true, limit: 20, page: 1 })).toMatchObject({
      followedOnly: true,
      limit: 20,
      page: 1,
    });
  });

  test("requires a non-empty query for article search", () => {
    expect(ArticleSearchSchema.parse({ query: "  économie  " }).query).toBe("économie");
    expect(ArticleSearchSchema.safeParse({ query: "  " }).success).toBeFalse();
    expect(ArticleListSchema.safeParse({ search: "legacy" }).success).toBeFalse();
  });

  test("defaults new bookmark collections to private", () => {
    expect(createBookmarkSchema.parse({ name: "  À lire  " })).toEqual({
      isPublic: false,
      name: "À lire",
    });
  });

  test("requires an owner-scoped identifier when updating a bookmark", () => {
    expect(updateBookmarkSchema.safeParse({ id, isPublic: false, name: "Sélection" }).success).toBe(
      true,
    );
    expect(updateBookmarkSchema.safeParse({ isPublic: false, name: "Sélection" }).success).toBe(
      false,
    );
  });

  test("trims and bounds comments", () => {
    expect(createCommentSchema.parse({ articleId: id, content: "  Très utile  " }).content).toBe(
      "Très utile",
    );
    expect(createCommentSchema.safeParse({ articleId: id, content: "x".repeat(513) }).success).toBe(
      false,
    );
  });
});
