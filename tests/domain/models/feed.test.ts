import { describe, expect, test } from "bun:test";

import {
  createBookmarkSchema,
  createCommentSchema,
  readerArticleListSchema,
  readerSourceListSchema,
  updateBookmarkSchema,
} from "../../../packages/domain/src/models/feed";

const id = "0198f0e2-5c2d-7bba-ae95-3d7eae12b2bc";

describe("reader feed schemas", () => {
  test("accepts bounded reader filters", () => {
    expect(
      readerArticleListSchema.parse({ limit: 20, page: 1, search: "  économie  ", sourceId: id }),
    ).toMatchObject({ limit: 20, page: 1, search: "économie", sourceId: id });
    expect(readerSourceListSchema.parse({ followedOnly: true, limit: 20, page: 1 })).toMatchObject({
      followedOnly: true,
      limit: 20,
      page: 1,
    });
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
