import { desc, eq, sql } from "drizzle-orm";

import type { Database } from "#db/client";
import { NotFoundError } from "#db/errors";
import { ingestionAgents, ingestionRuns } from "#db/schema";

const AGENT_ONLINE_WINDOW_MS = 60_000;

export async function getIngestionAgents(db: Database) {
  const generatedAt = new Date();
  const agents = await db.query.ingestionAgents.findMany({
    orderBy: [desc(ingestionAgents.lastSeenAt)],
  });

  return {
    agents: agents.map((agent) => presentAgent(agent, generatedAt)),
    generatedAt,
  };
}

export async function getIngestionAgentDetails(db: Database, agentId: string) {
  const agent = await db.query.ingestionAgents.findFirst({
    where: eq(ingestionAgents.id, agentId),
  });

  if (!agent) {
    throw new NotFoundError("Ingestion agent not found");
  }

  const [summary] = await db
    .select({
      activeRuns: sql<number>`COUNT(*) FILTER (WHERE ${ingestionRuns.state} IN ('preparing', 'running'))::int`,
      articlesDelivered: sql<number>`COALESCE(SUM(${ingestionRuns.articlesDelivered}), 0)::int`,
      completedRuns: sql<number>`COUNT(*) FILTER (WHERE ${ingestionRuns.state} = 'completed')::int`,
      failedRuns: sql<number>`COUNT(*) FILTER (WHERE ${ingestionRuns.state} = 'failed')::int`,
      totalRuns: sql<number>`COUNT(*)::int`,
    })
    .from(ingestionRuns)
    .where(eq(ingestionRuns.agentId, agentId));

  return {
    agent: presentAgent(agent, new Date()),
    summary: summary ?? {
      activeRuns: 0,
      articlesDelivered: 0,
      completedRuns: 0,
      failedRuns: 0,
      totalRuns: 0,
    },
  };
}

function presentAgent(agent: typeof ingestionAgents.$inferSelect, generatedAt: Date) {
  const online = generatedAt.getTime() - agent.lastSeenAt.getTime() <= AGENT_ONLINE_WINDOW_MS;

  return {
    ...agent,
    online,
    state: online ? agent.state : ("offline" as const),
  };
}
