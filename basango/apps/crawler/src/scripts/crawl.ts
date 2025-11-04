import { logger } from "@basango/logger";
import { runSyncCrawl } from "@/process/sync/tasks";
import { parseCrawlingCliArgs, CRAWLING_USAGE } from "@/scripts/utils";

const main = async (): Promise<void> => {
  const options = parseCrawlingCliArgs();

  if (options.sourceId === undefined) {
    console.log(CRAWLING_USAGE);
    process.exitCode = 1;
    return;
  }

  try {
    await runSyncCrawl({ ...options });
  } catch (error) {
    logger.error({ error }, "Synchronous crawl failed");
    process.exitCode = 1;
  }
};

void main();
