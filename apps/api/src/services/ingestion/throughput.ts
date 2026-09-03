import type { Database } from "@basango/db/client";
import { getIngestionThroughput } from "@basango/db/queries";

type ThroughputSnapshot = Awaited<ReturnType<typeof getIngestionThroughput>>;

const THROUGHPUT_CACHE_MAX_AGE_MS = 15_000;

let cachedGeneration = -1;
let cachedSnapshot: ThroughputSnapshot | undefined;
let cachedAt = 0;
let generation = 0;
let inFlightGeneration = -1;
let inFlightSnapshot: Promise<ThroughputSnapshot> | undefined;

export function invalidateIngestionThroughput() {
  generation += 1;
}

export async function getIngestionThroughputSnapshot(db: Database) {
  const now = Date.now();

  if (
    cachedSnapshot &&
    cachedGeneration === generation &&
    now - cachedAt < THROUGHPUT_CACHE_MAX_AGE_MS
  ) {
    return cachedSnapshot;
  }

  if (inFlightSnapshot && inFlightGeneration === generation) {
    return inFlightSnapshot;
  }

  const requestedGeneration = generation;
  const request = getIngestionThroughput(db).then((snapshot) => {
    if (generation === requestedGeneration) {
      cachedAt = Date.now();
      cachedGeneration = requestedGeneration;
      cachedSnapshot = snapshot;
    }

    return snapshot;
  });
  inFlightGeneration = requestedGeneration;
  inFlightSnapshot = request;

  try {
    return await request;
  } finally {
    if (inFlightSnapshot === request) {
      inFlightSnapshot = undefined;
    }
  }
}
