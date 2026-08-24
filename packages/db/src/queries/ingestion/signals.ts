import type { IngestionRunMetrics, IngestionSignal } from "@basango/domain/models";
import { and, eq, inArray, sql } from "drizzle-orm";

import type { Database } from "#db/client";
import { ingestionActivities, ingestionAgents, ingestionRuns } from "#db/schema";

type AgentSignal = Extract<IngestionSignal, { type: `agent.${string}` }>;
type RunSignal = Exclude<IngestionSignal, AgentSignal>;
type RunState = "preparing" | "running" | "completed" | "failed";

const EMPTY_METRICS: IngestionRunMetrics = {
  articlesDelivered: 0,
  articlesDiscovered: 0,
  articlesFailed: 0,
  articlesPersisted: 0,
};

const getRunState = (signal: RunSignal): RunState => {
  if (signal.type === "run.preparing") return "preparing";
  if (signal.type === "run.completed") return "completed";
  if (signal.type === "run.failed") return "failed";
  return "running";
};

const getMetrics = (signal: RunSignal): IngestionRunMetrics =>
  "metrics" in signal ? signal.metrics : EMPTY_METRICS;

const isTerminal = (signal: RunSignal) =>
  signal.type === "run.completed" || signal.type === "run.failed";

export async function applyIngestionSignal(db: Database, signal: IngestionSignal) {
  return db.transaction(async (tx) => {
    const isAgentSignal = signal.type === "agent.heartbeat" || signal.type === "agent.reset";
    const data = {
      ...signal,
      emittedAt: signal.emittedAt.toISOString(),
    };
    const [activity] = await tx
      .insert(ingestionActivities)
      .values({
        agentId: signal.agentId,
        data,
        id: signal.signalId,
        occurredAt: signal.emittedAt,
        runId: isAgentSignal ? undefined : signal.runId,
        sourceId: isAgentSignal ? undefined : signal.sourceId,
        type: signal.type,
      })
      .onConflictDoNothing({ target: ingestionActivities.id })
      .returning({ id: ingestionActivities.id });

    if (!activity) return { duplicate: true };

    if (signal.type === "agent.heartbeat") {
      await tx
        .insert(ingestionAgents)
        .values({
          id: signal.agentId,
          lastSeenAt: signal.emittedAt,
          state: "idle",
          version: signal.version,
        })
        .onConflictDoUpdate({
          set: {
            lastSeenAt: signal.emittedAt,
            version: signal.version ?? sql`${ingestionAgents.version}`,
          },
          setWhere: sql`${ingestionAgents.lastSeenAt} <= ${signal.emittedAt}`,
          target: ingestionAgents.id,
        });
      return { duplicate: false };
    }

    if (signal.type === "agent.reset") {
      await tx
        .insert(ingestionAgents)
        .values({
          activeRunId: null,
          id: signal.agentId,
          lastSeenAt: signal.emittedAt,
          state: "idle",
          version: signal.version,
        })
        .onConflictDoUpdate({
          set: {
            activeRunId: null,
            lastSeenAt: signal.emittedAt,
            state: "idle",
            version: signal.version ?? sql`${ingestionAgents.version}`,
          },
          target: ingestionAgents.id,
        });
      await tx
        .update(ingestionRuns)
        .set({
          completedAt: signal.emittedAt,
          error: "Agent queues and local outbox were reset",
          lastSignalAt: signal.emittedAt,
          state: "failed",
        })
        .where(
          and(
            eq(ingestionRuns.agentId, signal.agentId),
            inArray(ingestionRuns.state, ["preparing", "running"]),
          ),
        );
      return { duplicate: false };
    }

    const terminal = isTerminal(signal);
    const state = getRunState(signal);
    const metrics = getMetrics(signal);
    const projectedMetrics =
      "metrics" in signal
        ? metrics
        : {
            articlesDelivered: sql`${ingestionRuns.articlesDelivered}`,
            articlesDiscovered: sql`${ingestionRuns.articlesDiscovered}`,
            articlesFailed: sql`${ingestionRuns.articlesFailed}`,
            articlesPersisted: sql`${ingestionRuns.articlesPersisted}`,
          };

    await tx
      .insert(ingestionAgents)
      .values({
        activeRunId: terminal ? null : signal.runId,
        id: signal.agentId,
        lastSeenAt: signal.emittedAt,
        state: terminal ? "idle" : "busy",
        version: signal.version,
      })
      .onConflictDoUpdate({
        set: {
          activeRunId: terminal
            ? sql`CASE WHEN ${ingestionAgents.activeRunId} = ${signal.runId} THEN NULL ELSE ${ingestionAgents.activeRunId} END`
            : signal.runId,
          lastSeenAt: signal.emittedAt,
          state: terminal
            ? sql`CASE WHEN ${ingestionAgents.activeRunId} = ${signal.runId} THEN 'idle' ELSE ${ingestionAgents.state} END`
            : "busy",
          version: signal.version ?? sql`${ingestionAgents.version}`,
        },
        setWhere: sql`${ingestionAgents.lastSeenAt} <= ${signal.emittedAt}`,
        target: ingestionAgents.id,
      });

    await tx
      .insert(ingestionRuns)
      .values({
        agentId: signal.agentId,
        ...metrics,
        completedAt: terminal ? signal.emittedAt : undefined,
        createdAt: signal.emittedAt,
        durationMs: "durationMs" in signal ? signal.durationMs : undefined,
        error: signal.type === "run.failed" ? signal.error : undefined,
        id: signal.runId,
        lastSignalAt: signal.emittedAt,
        sourceId: signal.sourceId,
        startedAt: signal.type === "run.preparing" ? undefined : signal.emittedAt,
        state,
      })
      .onConflictDoUpdate({
        set: {
          ...projectedMetrics,
          completedAt: terminal ? signal.emittedAt : sql`${ingestionRuns.completedAt}`,
          durationMs: "durationMs" in signal ? signal.durationMs : sql`${ingestionRuns.durationMs}`,
          error: signal.type === "run.failed" ? signal.error : sql`${ingestionRuns.error}`,
          lastSignalAt: signal.emittedAt,
          startedAt:
            signal.type === "run.started" ? signal.emittedAt : sql`${ingestionRuns.startedAt}`,
          state,
        },
        setWhere: sql`${ingestionRuns.lastSignalAt} <= ${signal.emittedAt}`,
        target: ingestionRuns.id,
      });

    return { duplicate: false };
  });
}
