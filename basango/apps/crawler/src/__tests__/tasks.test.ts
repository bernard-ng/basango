import { describe, expect, it, vi } from "vitest";

import {
  scheduleAsyncCrawl,
  registerCrawlerTaskHandlers,
  collectListing,
} from "./tasks";
import { QueueManager } from "./queue";

describe("Async tasks", () => {
  it("schedules crawl with provided manager", async () => {
    const enqueueListing = vi.fn().mockResolvedValue({ id: "job-1" });
    const manager = {
      enqueueListing,
    } as unknown as QueueManager;

    const jobId = await scheduleAsyncCrawl({
      sourceId: "radiookapi",
      queueManager: manager,
    });

    expect(jobId).toBe("job-1");
    expect(enqueueListing).toHaveBeenCalledWith({
      source_id: "radiookapi",
      env: "development",
      page_range: undefined,
      date_range: undefined,
      category: undefined,
    });
  });

  it("delegates listing collection to registered handler", async () => {
    const handler = vi.fn().mockResolvedValue(5);
    registerCrawlerTaskHandlers({ collectListing: handler });

    const count = await collectListing({
      source_id: "radiookapi",
      env: "development",
    });

    expect(count).toBe(5);
    expect(handler).toHaveBeenCalledWith({
      source_id: "radiookapi",
      env: "development",
      page_range: undefined,
      date_range: undefined,
      category: undefined,
    });
  });
});
