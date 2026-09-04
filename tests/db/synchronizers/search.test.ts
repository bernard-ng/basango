import { describe, expect, test } from "bun:test";

import { byteBoundedBatches } from "../../../packages/db/src/synchronizers/search";
import type { SearchDocument } from "../../../packages/search/src/indexer";

describe("search synchronization batches", () => {
  test("bounds batches by document count", () => {
    const documents = [document("1"), document("2"), document("3")];

    expect(byteBoundedBatches(documents, 2, 10_000).map((batch) => batch.length)).toEqual([2, 1]);
  });

  test("bounds batches by encoded JSON bytes", () => {
    const first = document("1");
    const second = document("2");
    const singleBatchBytes = Buffer.byteLength(JSON.stringify([first]), "utf8");

    expect(
      byteBoundedBatches([first, second], 10, singleBatchBytes + 1).map((batch) => batch.length),
    ).toEqual([1, 1]);
  });

  test("rejects a document larger than the byte limit", () => {
    const oversized = document("1", "x".repeat(1_000));

    expect(() => byteBoundedBatches([oversized], 10, 500)).toThrow("exceeds");
  });
});

function document(id: string, body = "body"): SearchDocument {
  return {
    body,
    categories: [],
    categoryId: null,
    categoryName: null,
    categorySlug: null,
    excerpt: body,
    id,
    image: null,
    link: `https://example.com/${id}`,
    publishedAt: "2026-09-01T00:00:00.000Z",
    publishedAtTimestamp: 1_788_220_800,
    readingTime: 1,
    sentiment: "neutral",
    sourceDisplayName: null,
    sourceId: "source",
    sourceName: "Source",
    sourceUrl: "https://example.com",
    title: `Article ${id}`,
  };
}
