import { logger } from "@basango/logger";

import { scheduleAsyncCrawl } from "@/process/async/tasks";
import { CRAWLING_USAGE, parseCrawlingCliArgs } from "@/scripts/utils";

const main = async (): Promise<void> => {
  const options = parseCrawlingCliArgs();

  if (options.sourceId === undefined) {
    console.log(CRAWLING_USAGE);
    process.exitCode = 1;
    return;
  }

  try {
    const id = await scheduleAsyncCrawl({ ...options });

    logger.info({ id, options }, "Scheduled asynchronous crawl job");
  } catch (error) {
    logger.error({ error }, "Failed to schedule crawl job");
    process.exitCode = 1;
  }
};

void main();
