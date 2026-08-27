"use client";

import { Badge } from "@basango/ui/components/badge";
import { Button } from "@basango/ui/components/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@basango/ui/components/dropdown-menu";
import { cn } from "@basango/ui/lib/utils";
import { CheckIcon, ChevronDownIcon } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

import type { IngestionRun } from "../../runs/types";
import { formatDuration, stateVariant } from "../../shared/ingestion-formatters";
import {
  createTimelineWindow,
  formatRunDate,
  getRunDurationMs,
  getRunWork,
  getTimelineBarBounds,
} from "../crawl-history-model";
import {
  CRAWL_TIMELINE_ZOOM_LEVELS,
  type CrawlTimelineZoom,
  DEFAULT_CRAWL_TIMELINE_ZOOM,
  createCrawlTimelineTicks,
  expandCrawlTimelineWindow,
  formatCrawlTimelineTick,
  getCrawlTimelineWidth,
} from "../crawl-timeline-scale";

const SOURCE_COLUMN_WIDTH = 320;

// Zoom anchoring, keyboard shortcuts, and Today navigation follow Circle's MIT-licensed
// ProjectsTimeline: https://github.com/ln-dev7/circle/blob/main/components/common/projects/projects-timeline.tsx

export type CrawlHistoryTimelineProps = {
  runs: readonly IngestionRun[];
};

export function CrawlHistoryTimeline({ runs }: CrawlHistoryTimelineProps) {
  const [nowMs, setNowMs] = useState<number>();
  const [zoom, setZoom] = useState<CrawlTimelineZoom>(DEFAULT_CRAWL_TIMELINE_ZOOM);
  const hasPositionedInitiallyRef = useRef(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const referenceMs = nowMs ?? Math.max(...runs.map((run) => new Date(run.lastSignalAt).getTime()));
  const baseTimelineWindow = createTimelineWindow(runs, referenceMs);
  const timelineWindow = expandCrawlTimelineWindow(baseTimelineWindow, zoom, referenceMs);
  const timelineWidth = getCrawlTimelineWidth(timelineWindow, zoom);
  const ticks = createCrawlTimelineTicks(timelineWindow, zoom);
  const maximumDurationMs = Math.max(...runs.map(getRunDurationMs), 1);
  const todayPosition = nowMs
    ? ((nowMs - timelineWindow.startMs) / timelineWindow.spanMs) * 100
    : -1;
  const showsNow = nowMs !== undefined && todayPosition >= 0 && todayPosition <= 100;

  useEffect(() => {
    setNowMs(Date.now());

    const timer = window.setInterval(() => setNowMs(Date.now()), 30_000);

    return () => window.clearInterval(timer);
  }, []);

  const setZoomLevel = useCallback(
    (nextZoom: CrawlTimelineZoom) => {
      if (nextZoom === zoom) {
        return;
      }

      const scrollArea = scrollAreaRef.current;
      const previousWidth = getCrawlTimelineWidth(timelineWindow, zoom);
      const nextWindow = expandCrawlTimelineWindow(baseTimelineWindow, nextZoom, referenceMs);
      const nextWidth = getCrawlTimelineWidth(nextWindow, nextZoom);

      setZoom(nextZoom);

      if (!scrollArea) {
        return;
      }

      const centerInTimeline =
        scrollArea.scrollLeft + scrollArea.clientWidth / 2 - SOURCE_COLUMN_WIDTH;
      const anchorRatio = Math.max(0, Math.min(1, centerInTimeline / previousWidth));
      const anchorTime = timelineWindow.startMs + anchorRatio * timelineWindow.spanMs;
      const nextAnchor = (anchorTime - nextWindow.startMs) / nextWindow.spanMs;

      window.requestAnimationFrame(() => {
        scrollArea.scrollLeft =
          SOURCE_COLUMN_WIDTH + nextAnchor * nextWidth - scrollArea.clientWidth / 2;
      });
    },
    [baseTimelineWindow, referenceMs, timelineWindow, zoom],
  );

  const scrollToToday = useCallback(() => {
    const scrollArea = scrollAreaRef.current;

    if (!scrollArea || nowMs === undefined) {
      return;
    }

    const todayOffset = ((nowMs - timelineWindow.startMs) / timelineWindow.spanMs) * timelineWidth;
    const anchor = Math.max(scrollArea.clientWidth / 3, SOURCE_COLUMN_WIDTH + 80);

    scrollArea.scrollTo({
      behavior: "smooth",
      left: Math.max(0, SOURCE_COLUMN_WIDTH + todayOffset - anchor),
    });
  }, [nowMs, timelineWidth, timelineWindow]);

  useEffect(() => {
    if (nowMs === undefined || hasPositionedInitiallyRef.current) {
      return;
    }

    hasPositionedInitiallyRef.current = true;
    scrollToToday();
  }, [nowMs, scrollToToday]);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.metaKey || event.ctrlKey || event.altKey) {
        return;
      }

      const target = event.target;

      if (
        target instanceof HTMLElement &&
        (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable)
      ) {
        return;
      }

      const level = CRAWL_TIMELINE_ZOOM_LEVELS.find((candidate) => {
        return candidate.shortcut.toLowerCase() === event.key.toLowerCase();
      });

      if (level) {
        setZoomLevel(level.id);
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [setZoomLevel]);

  return (
    <div className="relative h-full min-h-0">
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 z-40 w-px bg-border"
        style={{ left: SOURCE_COLUMN_WIDTH }}
      />
      <div className="absolute top-1.5 right-3 z-50 flex items-center gap-1.5">
        <Button onClick={scrollToToday} size="sm" type="button" variant="outline">
          Today
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger className="inline-flex h-7 items-center gap-1 rounded-lg border border-border bg-background px-2.5 text-[0.8rem] font-medium shadow-xs outline-none hover:bg-muted">
            {CRAWL_TIMELINE_ZOOM_LEVELS.find((level) => level.id === zoom)?.label}
            <ChevronDownIcon className="size-3 text-muted-foreground" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-40">
            {CRAWL_TIMELINE_ZOOM_LEVELS.map((level) => (
              <DropdownMenuItem key={level.id} onClick={() => setZoomLevel(level.id)}>
                <span className="flex-1">{level.label}</span>
                {zoom === level.id ? <CheckIcon className="size-3.5" /> : null}
                <span className="text-xs text-muted-foreground">{level.shortcut}</span>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <div
        className="h-full overflow-auto overscroll-contain [scrollbar-gutter:stable]"
        ref={scrollAreaRef}
      >
        <div
          className="relative min-h-full min-w-max"
          style={{ width: SOURCE_COLUMN_WIDTH + timelineWidth }}
        >
          <div className="sticky top-0 z-30 flex h-10 border-b bg-card/95 backdrop-blur-sm">
            <div
              className="sticky left-0 z-40 grid shrink-0 grid-cols-[minmax(0,1fr)_48px_64px] items-center gap-2 border-r bg-card px-3 text-[10px] font-medium uppercase tracking-wide text-muted-foreground"
              style={{ width: SOURCE_COLUMN_WIDTH }}
            >
              <span>Source / agent</span>
              <span className="text-right">Work</span>
              <span className="text-right">Time</span>
            </div>
            <div className="relative shrink-0" style={{ width: timelineWidth }}>
              {ticks.map((tick, index) => (
                <span
                  className={cn(
                    "absolute bottom-2 -translate-x-1/2 whitespace-nowrap text-[10px] font-medium uppercase tracking-wide text-muted-foreground",
                    index === 0 && "translate-x-0",
                    index === ticks.length - 1 && "-translate-x-full",
                  )}
                  key={tick}
                  style={{
                    left: `${((tick - timelineWindow.startMs) / timelineWindow.spanMs) * 100}%`,
                  }}
                >
                  {formatCrawlTimelineTick(tick, zoom)}
                </span>
              ))}
              {showsNow ? (
                <span
                  className="absolute bottom-1.5 -translate-x-1/2 rounded-full bg-violet-500 px-1.5 py-0.5 text-[9px] font-semibold uppercase text-white"
                  style={{ left: `${todayPosition}%` }}
                >
                  Now
                </span>
              ) : null}
            </div>
          </div>

          <div
            className="pointer-events-none absolute top-10 bottom-0 z-0"
            style={{ left: SOURCE_COLUMN_WIDTH, width: timelineWidth }}
          >
            {ticks.map((tick) => (
              <span
                className="absolute inset-y-0 w-px bg-border/70"
                key={tick}
                style={{
                  left: `${((tick - timelineWindow.startMs) / timelineWindow.spanMs) * 100}%`,
                }}
              />
            ))}
            {showsNow ? (
              <span
                className="absolute inset-y-0 z-10 w-px bg-violet-500/70"
                style={{ left: `${todayPosition}%` }}
              />
            ) : null}
          </div>

          <div className="relative z-10">
            {runs.map((run) => (
              <TimelineRow
                key={run.id}
                maximumDurationMs={maximumDurationMs}
                run={run}
                timelineWidth={timelineWidth}
                timelineWindow={timelineWindow}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

type TimelineRowProps = {
  maximumDurationMs: number;
  run: IngestionRun;
  timelineWindow: ReturnType<typeof createTimelineWindow>;
  timelineWidth: number;
};

function TimelineRow({ maximumDurationMs, run, timelineWindow, timelineWidth }: TimelineRowProps) {
  const durationMs = getRunDurationMs(run);
  const bounds = getTimelineBarBounds(run, timelineWindow);
  const barTone = resolveBarTone(run, durationMs / maximumDurationMs);
  const stateIcon = resolveStateIcon(run.state);

  return (
    <div className="group/row flex h-10 border-b last:border-b-0 hover:bg-muted/25">
      <div
        className="sticky left-0 z-30 grid shrink-0 grid-cols-[minmax(0,1fr)_48px_64px] items-center gap-2 border-r bg-card px-3 group-hover/row:bg-muted"
        style={{ width: SOURCE_COLUMN_WIDTH }}
      >
        <div
          className="flex min-w-0 items-center gap-1.5"
          title={`${run.sourceId} · ${run.agentId}`}
        >
          <span className={cn("size-1.5 shrink-0 rounded-full", stateIcon.dotClassName)} />
          <span className="truncate text-xs font-medium">{run.sourceId}</span>
          <Badge className="h-4 px-1 text-[9px] capitalize" variant={stateVariant(run.state)}>
            {run.state}
          </Badge>
        </div>
        <span className="text-right font-mono text-xs tabular-nums">{getRunWork(run)}</span>
        <span className="text-right font-mono text-xs tabular-nums text-muted-foreground">
          {formatDuration(durationMs)}
        </span>
      </div>

      <div className="relative z-0 isolate shrink-0" style={{ width: timelineWidth }}>
        <span
          className={cn("absolute top-2.5 z-20 h-5 min-w-2 rounded border shadow-xs", barTone)}
          style={{ left: `${bounds.left}%`, width: `${bounds.width}%` }}
          title={`${run.sourceId} · ${run.agentId} · ${formatRunDate(run.startedAt ?? run.createdAt)} · ${formatDuration(durationMs)} · ${run.articlesDelivered} delivered`}
        />
      </div>
    </div>
  );
}

function resolveBarTone(run: IngestionRun, durationRatio: number): string {
  if (run.state === "failed") {
    return "border-red-500/50 bg-red-500/15 text-red-700 dark:text-red-300";
  }

  if (run.state === "running" || run.state === "preparing") {
    return "border-violet-500/50 bg-violet-500/15 text-violet-700 dark:text-violet-300";
  }

  if (durationRatio >= 0.7) {
    return "border-orange-500/50 bg-orange-500/15 text-orange-700 dark:text-orange-300";
  }

  if (durationRatio >= 0.35) {
    return "border-amber-500/50 bg-amber-500/15 text-amber-700 dark:text-amber-300";
  }

  return "border-emerald-500/40 bg-emerald-500/15 text-emerald-700 dark:text-emerald-300";
}

function resolveStateIcon(state: IngestionRun["state"]) {
  if (state === "failed") {
    return {
      dotClassName: "bg-red-500",
    };
  }

  if (state === "completed") {
    return {
      dotClassName: "bg-emerald-500",
    };
  }

  if (state === "running") {
    return {
      dotClassName: "animate-pulse bg-violet-500",
    };
  }

  return {
    dotClassName: "bg-amber-500",
  };
}
