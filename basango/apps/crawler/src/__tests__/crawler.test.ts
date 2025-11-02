import { describe, expect, it, beforeEach, vi } from "vitest";

import { PipelineConfigManager } from "@/config";
import { registerCrawler, clearCrawlerRegistry, runSyncCrawl } from "@/process/crawler";
import { PipelineConfigSchema, SourceKindSchema } from "@/schema";

const createPipeline = () =>
  PipelineConfigSchema.parse({
    paths: {
      root: ".",
      data: ".",
      logs: ".",
      configs: ".",
    },
    sources: {
      html: [
        {
          source_id: "demo",
          source_url: "https://example.com",
          source_kind: SourceKindSchema.enum.html,
          pagination_template: "/page/{page}",
        },
      ],
      wordpress: [],
    },
  });

describe("runSyncCrawl", () => {
  beforeEach(() => {
    clearCrawlerRegistry();
  });

  it("invokes registered crawler factory", async () => {
    const pipeline = createPipeline();
    const fetch = vi.fn().mockResolvedValue(undefined);
    const close = vi.fn();

    registerCrawler(SourceKindSchema.enum.html, () => ({ fetch, close }));

    const manager = {
      get: vi.fn().mockReturnValue(pipeline),
      setupLogging: vi.fn(),
    } as unknown as PipelineConfigManager;

    const persistClose = vi.fn();
    const persistFactory = vi.fn().mockReturnValue([
      { persist: vi.fn(), close: persistClose },
    ]);

    await runSyncCrawl({
      sourceId: "demo",
      env: "test",
      manager,
      persistFactory,
    });

    expect(fetch).toHaveBeenCalledTimes(1);
    expect(close).toHaveBeenCalledTimes(1);
    expect(persistFactory).toHaveBeenCalledWith({
      pipeline,
      source: pipeline.sources.html[0],
      resolvedSourceId: "demo",
    });
    expect(persistClose).toHaveBeenCalledTimes(1);
  });

  it("throws when source is missing", async () => {
    const pipeline = createPipeline();
    registerCrawler(SourceKindSchema.enum.html, () => ({ fetch: vi.fn() }));
    const manager = {
      get: vi.fn().mockReturnValue(pipeline),
      setupLogging: vi.fn(),
    } as unknown as PipelineConfigManager;

    await expect(
      runSyncCrawl({ sourceId: "unknown", manager }),
    ).rejects.toThrow("Source 'unknown' not found");
  });

  it("throws when no crawler registered", async () => {
    const pipeline = createPipeline();
    const manager = {
      get: vi.fn().mockReturnValue(pipeline),
      setupLogging: vi.fn(),
    } as unknown as PipelineConfigManager;

    await expect(
      runSyncCrawl({ sourceId: "demo", manager }),
    ).rejects.toThrow("No crawler registered");
  });
});
