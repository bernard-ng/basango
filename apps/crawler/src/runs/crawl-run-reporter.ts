import { logger } from "@basango/logger";

import type { CrawlRunEvent } from "#crawler/runs/crawl-run-events";

export interface CrawlRunReporter {
  emit(event: CrawlRunEvent): Promise<void> | void;
}

export class NoopCrawlRunReporter implements CrawlRunReporter {
  emit(): void {
    // Intentionally empty until dashboard/API event transport is wired.
  }
}

export class LoggingCrawlRunReporter implements CrawlRunReporter {
  emit(event: CrawlRunEvent): void {
    logger.info(
      {
        ...event,
        timestamp: (event.timestamp ?? new Date()).toISOString(),
      },
      "Crawler run event",
    );
  }
}
