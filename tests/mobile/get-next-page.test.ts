import { describe, expect, test } from "bun:test";

import { getNextPage } from "../../apps/mobile/src/features/content/shared/get-next-page";

describe("mobile article pagination", () => {
  test("advances through the existing page metadata", () => {
    expect(getNextPage({ current: 1, hasNext: true })).toBe(2);
    expect(getNextPage({ current: 8, hasNext: true })).toBe(9);
  });

  test("stops when the API reports the last page", () => {
    expect(getNextPage({ current: 9, hasNext: false })).toBeUndefined();
  });
});
