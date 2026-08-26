import type { Database } from "@basango/db/client";
import { getIngestionThroughput } from "@basango/db/queries";

type ThroughputSnapshot = Awaited<ReturnType<typeof getIngestionThroughput>>;

let cachedGeneration = -1;
let cachedSnapshot: ThroughputSnapshot | undefined;
let generation = 0;
let inFlightGeneration = -1;
let inFlightSnapshot: Promise<ThroughputSnapshot> | undefined;

export function invalidateIngestionThroughput() {
  generation += 1;
}

export async function getIngestionThroughputSnapshot(db: Database) {
  if (cachedSnapshot && cachedGeneration === generation) {
    return cachedSnapshot;
  }

  if (inFlightSnapshot && inFlightGeneration === generation) {
    return inFlightSnapshot;
  }

  const requestedGeneration = generation;
  const request = getIngestionThroughput(db).then((snapshot) => {
    if (generation === requestedGeneration) {
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
