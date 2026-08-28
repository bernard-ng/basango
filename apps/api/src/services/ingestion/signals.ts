import type { Database } from "@basango/db/client";
import { applyIngestionSignal } from "@basango/db/queries";
import type {
  IngestionChange,
  IngestionChangeTopic,
  IngestionSignal,
  IngestionSignalType,
} from "@basango/domain/models";
import * as uuid from "uuid";

import { invalidateIngestionThroughput } from "./throughput";

type ChangeListener = (change: IngestionChange) => void;

const CHANGE_COALESCE_MS = 250;

const topicsBySignalType = {
  "agent.heartbeat": ["agents"],
  "agent.reset": ["agents", "runs", "summary", "throughput"],
  "run.completed": ["agents", "runs", "summary", "throughput"],
  "run.failed": ["agents", "runs", "summary", "throughput"],
  "run.preparing": ["agents", "runs", "summary"],
  "run.progress": ["agents", "runs", "summary", "throughput"],
  "run.started": ["agents", "runs", "summary"],
} satisfies Record<IngestionSignalType, readonly IngestionChangeTopic[]>;

const listeners = new Set<ChangeListener>();
const pendingTopics = new Set<IngestionChangeTopic>();
let pendingSignalId: string | undefined;
let flushTimer: ReturnType<typeof setTimeout> | undefined;

export async function acceptIngestionSignal(db: Database, signal: IngestionSignal) {
  const result = await applyIngestionSignal(db, signal);

  if (!result.duplicate) {
    if (getIngestionChangeTopics(signal.type).some((topic) => topic === "throughput")) {
      invalidateIngestionThroughput();
    }

    queueSignalChange(signal);
  }

  return result;
}

export function subscribeToIngestionChanges(listener: ChangeListener) {
  listeners.add(listener);

  return () => listeners.delete(listener);
}

export function getIngestionChangeTopics(type: IngestionSignalType) {
  return topicsBySignalType[type];
}

export function announceIngestionChange(topics: readonly IngestionChangeTopic[]) {
  queueIngestionChange({ latestSignalId: uuid.v7(), topics: [...topics] });
}

function queueSignalChange(signal: IngestionSignal) {
  queueIngestionChange({
    latestSignalId: signal.signalId,
    topics: getIngestionChangeTopics(signal.type),
  });
}

function queueIngestionChange(change: IngestionChange) {
  for (const topic of change.topics) {
    pendingTopics.add(topic);
  }

  if (!pendingSignalId || change.latestSignalId > pendingSignalId) {
    pendingSignalId = change.latestSignalId;
  }

  if (!flushTimer) {
    flushTimer = setTimeout(flushIngestionChanges, CHANGE_COALESCE_MS);
  }
}

function flushIngestionChanges() {
  flushTimer = undefined;

  if (!pendingSignalId || pendingTopics.size === 0) {
    return;
  }

  const change: IngestionChange = {
    latestSignalId: pendingSignalId,
    topics: [...pendingTopics],
  };
  pendingSignalId = undefined;
  pendingTopics.clear();

  for (const listener of listeners) {
    listener(change);
  }
}
