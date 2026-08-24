import type { Database } from "@basango/db/client";
import { applyIngestionSignal } from "@basango/db/queries";
import type { IngestionSignal } from "@basango/domain/models";

type ChangeListener = (signalId: string) => void;

const listeners = new Set<ChangeListener>();

export async function acceptIngestionSignal(db: Database, signal: IngestionSignal) {
  const result = await applyIngestionSignal(db, signal);
  if (!result.duplicate) {
    for (const listener of listeners) listener(signal.signalId);
  }
  return result;
}

export function subscribeToIngestionChanges(listener: ChangeListener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
