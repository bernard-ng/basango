import type { IngestionRun } from "../operations/types";

export const CRAWL_HISTORY_PAGE_SIZE = 50;

export type CrawlHistorySort = "latest" | "slowest" | "work";

export type CrawlTimelineWindow = {
  endMs: number;
  spanMs: number;
  startMs: number;
};

const MINIMUM_TIMELINE_SPAN_MS = 60 * 60 * 1_000;

const runDateFormatter = new Intl.DateTimeFormat("en", {
  day: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  month: "short",
});

export function createTimelineWindow(
  runs: readonly IngestionRun[],
  referenceMs?: number,
): CrawlTimelineWindow {
  const starts = runs.map(getRunStartMs);
  const ends = runs.map(getRunEndMs);

  if (referenceMs !== undefined) {
    const referenceDay = new Date(referenceMs);

    referenceDay.setHours(0, 0, 0, 0);
    starts.push(referenceDay.getTime());
    ends.push(referenceDay.getTime() + 24 * 60 * 60 * 1_000);
  }

  const earliest = Math.min(...starts);
  const latest = Math.max(...ends);
  const contentSpan = Math.max(latest - earliest, MINIMUM_TIMELINE_SPAN_MS);
  const padding = contentSpan * 0.04;
  const startMs = earliest - padding;
  const endMs = earliest + contentSpan + padding;

  return {
    endMs,
    spanMs: endMs - startMs,
    startMs,
  };
}

export function getRunStartMs(run: IngestionRun): number {
  return new Date(run.startedAt ?? run.createdAt).getTime();
}

export function getRunEndMs(run: IngestionRun): number {
  const startMs = getRunStartMs(run);

  if (run.durationMs !== null) {
    return startMs + run.durationMs;
  }

  return new Date(run.completedAt ?? run.lastSignalAt).getTime();
}

export function getRunDurationMs(run: IngestionRun): number {
  return Math.max(0, getRunEndMs(run) - getRunStartMs(run));
}

export function getRunWork(run: IngestionRun): number {
  return run.articlesProcessed ?? run.articlesDiscovered;
}

export function getTimelineBarBounds(run: IngestionRun, window: CrawlTimelineWindow) {
  const left = ((getRunStartMs(run) - window.startMs) / window.spanMs) * 100;
  const width = (getRunDurationMs(run) / window.spanMs) * 100;

  return {
    left: Math.max(0, Math.min(100, left)),
    width: Math.max(0, Math.min(100 - left, width)),
  };
}

export function formatRunDate(value: Date): string {
  return runDateFormatter.format(value);
}
