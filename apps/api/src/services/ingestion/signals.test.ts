import { describe, expect, test } from "bun:test";

import { getIngestionChangeTopics } from "./signals";

describe("ingestion change topics", () => {
  test("limits heartbeats to agent state", () => {
    expect(getIngestionChangeTopics("agent.heartbeat")).toEqual(["agents"]);
  });

  test("refreshes every affected projection for progress and terminal signals", () => {
    expect(getIngestionChangeTopics("run.progress")).toEqual([
      "agents",
      "runs",
      "summary",
      "throughput",
    ]);
    expect(getIngestionChangeTopics("run.completed")).toContain("throughput");
    expect(getIngestionChangeTopics("run.failed")).toContain("throughput");
  });
});
