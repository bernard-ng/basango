import { describe, expect, test } from "bun:test";

import type { CrawlTimelineWindow } from "../../../../../apps/dashboard/src/features/ingestion/history/crawl-history-model";
import {
  createCrawlTimelineTicks,
  expandCrawlTimelineWindow,
  getCrawlTimelineWidth,
} from "../../../../../apps/dashboard/src/features/ingestion/history/crawl-timeline-scale";

const HOUR_MS = 60 * 60 * 1_000;
const referenceMs = new Date("2026-08-26T12:00:00.000Z").getTime();
const dayWindow: CrawlTimelineWindow = {
  endMs: referenceMs + 12 * HOUR_MS,
  spanMs: 24 * HOUR_MS,
  startMs: referenceMs - 12 * HOUR_MS,
};

describe("crawl timeline scale", () => {
  test("uses an hourly scale for the Day view", () => {
    const ticks = createCrawlTimelineTicks(dayWindow, "day");

    expect(ticks.slice(0, 2)).toEqual([dayWindow.startMs, dayWindow.startMs + HOUR_MS]);
    expect(getCrawlTimelineWidth(dayWindow, "day")).toBe(2_880);
  });

  test("expands the date window for wider zoom levels", () => {
    const yearWindow = expandCrawlTimelineWindow(dayWindow, "year", referenceMs);

    expect(yearWindow.spanMs).toBeGreaterThanOrEqual(365 * 24 * HOUR_MS);
    expect(getCrawlTimelineWidth(yearWindow, "year")).toBeGreaterThan(4_000);
  });
});
