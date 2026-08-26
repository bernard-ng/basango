import type { CrawlTimelineWindow } from "./crawl-history-model";

export const CRAWL_TIMELINE_ZOOM_LEVELS = [
  { id: "year", label: "Year", minimumHours: 24 * 365, pixelsPerHour: 0.5, shortcut: "Y" },
  {
    id: "quarter",
    label: "Quarter",
    minimumHours: 24 * 90,
    pixelsPerHour: 1.5,
    shortcut: "Q",
  },
  { id: "month", label: "Month", minimumHours: 24 * 30, pixelsPerHour: 4, shortcut: "M" },
  { id: "week", label: "Week", minimumHours: 24 * 7, pixelsPerHour: 12, shortcut: "W" },
  { id: "day", label: "Day", minimumHours: 24, pixelsPerHour: 120, shortcut: "D" },
] as const;

export type CrawlTimelineZoom = (typeof CRAWL_TIMELINE_ZOOM_LEVELS)[number]["id"];

export const DEFAULT_CRAWL_TIMELINE_ZOOM: CrawlTimelineZoom = "day";

const MINIMUM_TIMELINE_WIDTH = 1_200;
const MAXIMUM_TIMELINE_WIDTH = 100_000;
const HOUR_MS = 60 * 60 * 1_000;
const DAY_TICK_FORMATTER = new Intl.DateTimeFormat("en", {
  hour: "2-digit",
  hour12: false,
  minute: "2-digit",
});
const WEEK_TICK_FORMATTER = new Intl.DateTimeFormat("en", {
  hour: "numeric",
  weekday: "short",
});
const MONTH_TICK_FORMATTER = new Intl.DateTimeFormat("en", {
  day: "numeric",
  month: "short",
});
const MONTH_NAME_FORMATTER = new Intl.DateTimeFormat("en", { month: "short" });
const MONTH_YEAR_FORMATTER = new Intl.DateTimeFormat("en", {
  month: "short",
  year: "numeric",
});

export function getCrawlTimelineWidth(
  window: CrawlTimelineWindow,
  zoom: CrawlTimelineZoom,
): number {
  const level = resolveZoomLevel(zoom);
  const hours = window.spanMs / HOUR_MS;

  return Math.min(
    MAXIMUM_TIMELINE_WIDTH,
    Math.max(MINIMUM_TIMELINE_WIDTH, hours * level.pixelsPerHour),
  );
}

export function expandCrawlTimelineWindow(
  window: CrawlTimelineWindow,
  zoom: CrawlTimelineZoom,
  referenceMs: number,
): CrawlTimelineWindow {
  const level = resolveZoomLevel(zoom);
  const minimumSpanMs = level.minimumHours * HOUR_MS;

  if (window.spanMs >= minimumSpanMs) {
    return window;
  }

  const startMs = Math.min(window.startMs, referenceMs - minimumSpanMs / 2);
  const endMs = Math.max(window.endMs, referenceMs + minimumSpanMs / 2);

  return { endMs, spanMs: endMs - startMs, startMs };
}

export function createCrawlTimelineTicks(
  window: CrawlTimelineWindow,
  zoom: CrawlTimelineZoom,
): number[] {
  if (zoom === "year" || zoom === "quarter") {
    return createMonthTicks(window);
  }

  if (zoom === "month") {
    return createDayTicks(window);
  }

  const intervalMs = zoom === "day" ? HOUR_MS : 6 * HOUR_MS;
  const firstTick = Math.ceil(window.startMs / intervalMs) * intervalMs;
  const ticks: number[] = [];

  for (let tick = firstTick; tick <= window.endMs; tick += intervalMs) {
    ticks.push(tick);
  }

  return ticks;
}

export function formatCrawlTimelineTick(value: number, zoom: CrawlTimelineZoom): string {
  const date = new Date(value);

  if (zoom === "day") {
    return DAY_TICK_FORMATTER.format(date);
  }

  if (zoom === "week") {
    return WEEK_TICK_FORMATTER.format(date);
  }

  if (zoom === "month") {
    return MONTH_TICK_FORMATTER.format(date);
  }

  const formatter = date.getMonth() === 0 ? MONTH_YEAR_FORMATTER : MONTH_NAME_FORMATTER;

  return formatter.format(date);
}

function createMonthTicks(window: CrawlTimelineWindow): number[] {
  const cursor = new Date(window.startMs);
  const ticks: number[] = [];

  cursor.setDate(1);
  cursor.setHours(0, 0, 0, 0);

  if (cursor.getTime() < window.startMs) {
    cursor.setMonth(cursor.getMonth() + 1);
  }

  while (cursor.getTime() <= window.endMs) {
    ticks.push(cursor.getTime());
    cursor.setMonth(cursor.getMonth() + 1);
  }

  return ticks;
}

function createDayTicks(window: CrawlTimelineWindow): number[] {
  const cursor = new Date(window.startMs);
  const ticks: number[] = [];

  cursor.setHours(0, 0, 0, 0);

  if (cursor.getTime() < window.startMs) {
    cursor.setDate(cursor.getDate() + 1);
  }

  while (cursor.getTime() <= window.endMs) {
    ticks.push(cursor.getTime());
    cursor.setDate(cursor.getDate() + 1);
  }

  return ticks;
}

function resolveZoomLevel(zoom: CrawlTimelineZoom) {
  return (
    CRAWL_TIMELINE_ZOOM_LEVELS.find((candidate) => candidate.id === zoom) ??
    CRAWL_TIMELINE_ZOOM_LEVELS[0]
  );
}
