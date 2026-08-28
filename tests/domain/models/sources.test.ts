import { describe, expect, test } from "bun:test";

import {
  calculateSourceCoveragePercent,
  getSourcePublicationBoundsResponseSchema,
  getSourcesSchema,
  syncCrawlerSourcesSchema,
} from "../../../packages/domain/src/models/sources";

describe("source list contracts", () => {
  test("accepts offset pagination", () => {
    expect(getSourcesSchema.parse({ limit: 6, page: 2 })).toEqual({ limit: 6, page: 2 });
  });
});

describe("crawler source synchronization", () => {
  test("accepts configured sources with and without an archive estimate", () => {
    const payload = syncCrawlerSourcesSchema.parse({
      sources: [
        {
          estimatedArticles: 240,
          kind: "html",
          name: "example.com",
          url: "https://example.com",
        },
        {
          kind: "wordpress",
          name: "news.example",
          url: "https://news.example",
        },
      ],
    });

    expect(payload.sources).toHaveLength(2);
    expect(payload.sources[0]?.estimatedArticles).toBe(240);
    expect(payload.sources[1]?.estimatedArticles).toBeUndefined();
  });

  test("rejects negative archive estimates", () => {
    const result = syncCrawlerSourcesSchema.safeParse({
      sources: [
        {
          estimatedArticles: -1,
          kind: "html",
          name: "example.com",
          url: "https://example.com",
        },
      ],
    });

    expect(result.success).toBeFalse();
  });
});

describe("source coverage", () => {
  test("rounds progress and caps approximate archives at 100 percent", () => {
    expect(calculateSourceCoveragePercent(75, 200)).toBe(38);
    expect(calculateSourceCoveragePercent(220, 200)).toBe(100);
  });

  test("omits progress without a usable estimate", () => {
    expect(calculateSourceCoveragePercent(12, null)).toBeNull();
    expect(calculateSourceCoveragePercent(12, 0)).toBeNull();
  });
});

describe("source publication bounds", () => {
  test("accepts empty bounds for a source without articles", () => {
    const bounds = getSourcePublicationBoundsResponseSchema.parse({
      earliest: null,
      latest: null,
    });

    expect(bounds).toEqual({ earliest: null, latest: null });
  });

  test("coerces populated bounds to dates", () => {
    const bounds = getSourcePublicationBoundsResponseSchema.parse({
      earliest: "2026-08-01T10:00:00Z",
      latest: "2026-08-22T20:36:57Z",
    });

    expect(bounds.earliest).toBeInstanceOf(Date);
    expect(bounds.latest).toBeInstanceOf(Date);
  });
});
