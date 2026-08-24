import { desc, ne } from "drizzle-orm";

import type { Database } from "#db/client";
import { ingestionActivities, ingestionAgents, ingestionRuns } from "#db/schema";

const AGENT_ONLINE_WINDOW_MS = 45_000;

export async function getIngestionOverview(db: Database) {
  const [agents, runs, activities] = await Promise.all([
    db.query.ingestionAgents.findMany({ orderBy: [desc(ingestionAgents.lastSeenAt)] }),
    db.query.ingestionRuns.findMany({
      limit: 24,
      orderBy: [desc(ingestionRuns.lastSignalAt)],
    }),
    db.query.ingestionActivities.findMany({
      limit: 80,
      orderBy: [desc(ingestionActivities.occurredAt)],
      where: ne(ingestionActivities.type, "agent.heartbeat"),
    }),
  ]);
  const now = Date.now();

  return {
    activities,
    agents: agents.map((agent) => {
      const online = now - agent.lastSeenAt.getTime() <= AGENT_ONLINE_WINDOW_MS;
      return {
        ...agent,
        online,
        state: online ? agent.state : "offline",
      };
    }),
    generatedAt: new Date(),
    runs,
  };
}
