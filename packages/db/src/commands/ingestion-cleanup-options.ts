import { parseArgs } from "node:util";

export const DEFAULT_INGESTION_RETENTION_DAYS = 5;

type IngestionCleanupOptions = {
  help: boolean;
  retentionDays: number;
};

export function parseIngestionCleanupOptions(args: readonly string[]): IngestionCleanupOptions {
  const { values } = parseArgs({
    args: [...args],
    options: {
      help: { short: "h", type: "boolean" },
      "retention-days": {
        default: String(DEFAULT_INGESTION_RETENTION_DAYS),
        type: "string",
      },
    },
    strict: true,
  });
  const retentionDays = Number(values["retention-days"]);

  if (!Number.isInteger(retentionDays) || retentionDays < 1) {
    throw new Error("--retention-days must be a positive whole number.");
  }

  return {
    help: values.help ?? false,
    retentionDays,
  };
}

export function createIngestionRetentionCutoff(retentionDays: number, now = new Date()): Date {
  return new Date(now.getTime() - retentionDays * 24 * 60 * 60 * 1_000);
}
