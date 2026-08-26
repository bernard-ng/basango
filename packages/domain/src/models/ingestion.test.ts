import { describe, expect, test } from "bun:test";

import { ingestionRunsQuerySchema, ingestionSignalSchema } from "./ingestion";

const envelope = {
  agentId: "crawler-lubumbashi-01",
  emittedAt: "2026-08-23T12:00:00.000Z",
  signalId: "0198d7e4-df8c-7000-8000-000000000001",
};

describe("ingestion signal protocol", () => {
  test("parses a discriminated progress signal with absolute metrics", () => {
    const signal = ingestionSignalSchema.parse({
      ...envelope,
      metrics: {
        articlesDelivered: 2,
        articlesDiscovered: 5,
        articlesFailed: 1,
        articlesPersisted: 4,
        articlesProcessed: 5,
        articlesSkipped: 1,
      },
      runId: "0198d7e4-df8c-7000-8000-000000000002",
      sourceId: "radiookapi.net",
      type: "run.progress",
    });

    expect(signal.type).toBe("run.progress");
    expect(signal.emittedAt).toBeInstanceOf(Date);
    if ("metrics" in signal) {
      expect(signal.metrics.articlesProcessed).toBe(5);
      expect(signal.metrics.articlesSkipped).toBe(1);
    }
  });

  test("accepts legacy metrics without reconciliation counters", () => {
    const signal = ingestionSignalSchema.parse({
      ...envelope,
      durationMs: 1_000,
      metrics: {
        articlesDelivered: 2,
        articlesDiscovered: 5,
        articlesFailed: 0,
        articlesPersisted: 2,
      },
      runId: "0198d7e4-df8c-7000-8000-000000000002",
      sourceId: "radiookapi.net",
      type: "run.completed",
    });

    if ("metrics" in signal) {
      expect(signal.metrics.articlesProcessed).toBeUndefined();
      expect(signal.metrics.articlesSkipped).toBeUndefined();
    }
  });

  test("rejects ambiguous progress payloads without metrics", () => {
    expect(
      ingestionSignalSchema.safeParse({
        ...envelope,
        runId: "0198d7e4-df8c-7000-8000-000000000002",
        sourceId: "radiookapi.net",
        type: "run.progress",
      }).success,
    ).toBe(false);
  });

  test("accepts an agent reset without run context", () => {
    const signal = ingestionSignalSchema.parse({
      ...envelope,
      type: "agent.reset",
    });

    expect(signal.type).toBe("agent.reset");
  });
});

describe("ingestion runs query", () => {
  test("accepts server pagination, status filters, and sorting", () => {
    const query = ingestionRunsQuerySchema.parse({
      filters: {
        query: "radio okapi",
        states: ["running", "failed"],
      },
      page: {
        current: 2,
        limit: 20,
      },
      sort: {
        direction: "asc",
        field: "sourceId",
      },
    });

    expect(query.page).toEqual({ current: 2, limit: 20 });
    expect(query.filters?.states).toEqual(["running", "failed"]);
  });

  test("rejects unsupported states and oversized pages", () => {
    expect(
      ingestionRunsQuerySchema.safeParse({
        filters: { states: ["offline"] },
        page: { current: 1, limit: 100 },
      }).success,
    ).toBe(false);
  });
});
