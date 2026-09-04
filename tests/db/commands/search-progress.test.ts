import { describe, expect, test } from "bun:test";

import { formatSearchProgress } from "../../../packages/db/src/commands/search-progress";

describe("search command progress", () => {
  test("formats completed work as a percentage bar", () => {
    expect(formatSearchProgress("Rebuilding search", { completed: 25, total: 100 }, 10)).toBe(
      "Rebuilding search [###-------]  25% (25/100)",
    );
  });

  test("caps progress when the corpus grows during a rebuild", () => {
    expect(formatSearchProgress("Rebuilding search", { completed: 12, total: 10 }, 10)).toBe(
      "Rebuilding search [##########] 100% (12/12)",
    );
  });

  test("treats an empty corpus as complete", () => {
    expect(formatSearchProgress("Rebuilding search", { completed: 0, total: 0 }, 10)).toBe(
      "Rebuilding search [##########] 100% (0/0)",
    );
  });
});
