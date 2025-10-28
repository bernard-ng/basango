import { describe, expect, it } from "vitest";

import { createQueueManager, createQueueSettings } from "./queue";

class InMemoryQueue {
  public jobs: Array<{ name: string; data: unknown }> = [];

  async add(name: string, data: unknown) {
    this.jobs.push({ name, data });
    return { id: `${name}-${this.jobs.length}` };
  }
}

describe("createQueueManager", () => {
  it("prefixes queue names", () => {
    const manager = createQueueManager({
      settings: createQueueSettings({ prefix: "test" }),
      queueFactory: (queueName) => {
        expect(queueName).toBe("listing");
        return new InMemoryQueue();
      },
      connection: {
        quit: async () => undefined,
      } as any,
    });

    expect(manager.iterQueueNames()).toEqual([
      "test:listing",
      "test:articles",
      "test:processed",
    ]);
  });

  it("enqueues listing job with validated payload", async () => {
    const queue = new InMemoryQueue();
    const manager = createQueueManager({
      queueFactory: () => queue,
      connection: { quit: async () => undefined } as any,
    });

    const job = await manager.enqueueListing({
      source_id: "radiookapi",
      env: "test",
    });

    expect(job.id).toBe("collect_listing-1");
    expect(queue.jobs[0]).toEqual({
      name: "collect_listing",
      data: {
        source_id: "radiookapi",
        env: "test",
        page_range: undefined,
        date_range: undefined,
        category: undefined,
      },
    });
  });
});
