import { describe, expect, test } from "bun:test";

import type { IngestionRun } from "../operations/types";
import {
  createTimelineWindow,
  getRunDurationMs,
  getTimelineBarBounds,
} from "./crawl-history-model";

describe("crawl history model", () => {
  test("uses signal timestamps when a run has no final duration", () => {
    const run = createRun({
      completedAt: null,
      durationMs: null,
      lastSignalAt: new Date("2026-08-26T10:05:00.000Z"),
      startedAt: new Date("2026-08-26T10:00:00.000Z"),
      state: "running",
    });

    expect(getRunDurationMs(run)).toBe(300_000);
  });

  test("places every run inside the padded timeline window", () => {
    const run = createRun({ durationMs: 600_000 });
    const window = createTimelineWindow([run]);
    const bounds = getTimelineBarBounds(run, window);

    expect(bounds.left).toBeGreaterThan(0);
    expect(bounds.left + bounds.width).toBeLessThan(100);
  });
});

function createRun(overrides: Partial<IngestionRun> = {}): IngestionRun {
  return {
    agentId: "crawler-lubumbashi-01",
    articlesDelivered: 8,
    articlesDiscovered: 12,
    articlesFailed: 0,
    articlesPersisted: 10,
    articlesProcessed: 12,
    articlesSkipped: 2,
    completedAt: new Date("2026-08-26T10:10:00.000Z"),
    createdAt: new Date("2026-08-26T10:00:00.000Z"),
    durationMs: 600_000,
    error: null,
    id: "0198d7e4-df8c-7000-8000-000000000001",
    lastSignalAt: new Date("2026-08-26T10:10:00.000Z"),
    sourceId: "radiookapi.net",
    startedAt: new Date("2026-08-26T10:00:00.000Z"),
    state: "completed",
    ...overrides,
  };
}
