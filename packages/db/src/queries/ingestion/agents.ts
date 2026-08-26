import { desc } from "drizzle-orm";

import type { Database } from "#db/client";
import { ingestionAgents } from "#db/schema";

const AGENT_ONLINE_WINDOW_MS = 45_000;

export async function getIngestionAgents(db: Database) {
  const generatedAt = new Date();
  const agents = await db.query.ingestionAgents.findMany({
    orderBy: [desc(ingestionAgents.lastSeenAt)],
  });
  const now = generatedAt.getTime();

  return {
    agents: agents.map((agent) => {
      const online = now - agent.lastSeenAt.getTime() <= AGENT_ONLINE_WINDOW_MS;

      return {
        ...agent,
        online,
        state: online ? agent.state : "offline",
      };
    }),
    generatedAt,
  };
}
