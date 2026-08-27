import { describe, expect, test } from "bun:test";

import { getSourcePublicationBoundsResponseSchema, getSourcesSchema } from "./sources";

describe("source list contracts", () => {
  test("accepts offset pagination", () => {
    expect(getSourcesSchema.parse({ limit: 6, page: 2 })).toEqual({ limit: 6, page: 2 });
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
