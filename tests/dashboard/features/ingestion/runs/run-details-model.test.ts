import { describe, expect, test } from "bun:test";

import { createRunDetailsModel } from "../../../../../apps/dashboard/src/features/ingestion/runs/run-details-model";

describe("ingestion run details model", () => {
  test("builds charts from only the selected run", () => {
    const occurredAt = new Date("2026-08-28T12:00:00.000Z");
    const model = createRunDetailsModel({
      run: {
        agentId: "crawler-01",
        articlesDelivered: 7,
        articlesDiscovered: 12,
        articlesFailed: 1,
        articlesPersisted: 8,
        articlesProcessed: 10,
        articlesSkipped: 2,
        completedAt: occurredAt,
        createdAt: occurredAt,
        durationMs: 10_000,
        error: null,
        id: "0198d7e4-df8c-7000-8000-000000000002",
        lastSignalAt: occurredAt,
        sourceId: "radiookapi.net",
        startedAt: occurredAt,
        state: "completed",
      },
      throughput: [
        {
          articlesDelivered: 3,
          articlesDiscovered: 5,
          articlesPersisted: 4,
          occurredAt,
        },
      ],
    });

    expect(model.pipelineData.map(({ stage, value }) => [stage, value])).toEqual([
      ["Discovered", 12],
      ["Processed", 10],
      ["Persisted", 8],
      ["Skipped", 2],
      ["Delivered", 7],
      ["Failed", 1],
    ]);
    expect(model.throughputSeries[0]).toMatchObject({
      delivered: 3,
      discovered: 5,
      persisted: 4,
    });
  });
});
