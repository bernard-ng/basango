import { describe, expect, test } from "bun:test";

import {
  DEFAULT_INGESTION_RETENTION_DAYS,
  createIngestionRetentionCutoff,
  parseIngestionCleanupOptions,
} from "../../../packages/db/src/commands/ingestion-cleanup-options";

describe("ingestion cleanup options", () => {
  test("uses the five-day default retention period", () => {
    const options = parseIngestionCleanupOptions([]);

    expect(options.retentionDays).toBe(DEFAULT_INGESTION_RETENTION_DAYS);
    expect(options.retentionDays).toBe(5);
  });

  test("accepts a positive retention override", () => {
    const options = parseIngestionCleanupOptions(["--retention-days", "14"]);

    expect(options.retentionDays).toBe(14);
  });

  test("rejects invalid retention periods", () => {
    expect(() => parseIngestionCleanupOptions(["--retention-days", "0"])).toThrow(
      "--retention-days must be a positive whole number.",
    );
    expect(() => parseIngestionCleanupOptions(["--retention-days", "1.5"])).toThrow(
      "--retention-days must be a positive whole number.",
    );
  });

  test("creates an exact retention cutoff", () => {
    const now = new Date("2026-09-03T12:00:00.000Z");

    expect(createIngestionRetentionCutoff(5, now)).toEqual(new Date("2026-08-29T12:00:00.000Z"));
  });
});
