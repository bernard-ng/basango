import { Badge } from "@basango/ui/components/badge";
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemMedia,
  ItemTitle,
} from "@basango/ui/components/item";
import { Link } from "@tanstack/react-router";

import { relativeTime, stateVariant } from "../../shared/ingestion-formatters";
import type { IngestionAgent } from "../types";
import { DashboardPanel, EmptyState } from "./dashboard-primitives";

type AgentHealthPanelProps = {
  agents: IngestionAgent[];
};

type AgentHealthItemProps = {
  agent: IngestionAgent;
};

export function AgentHealthPanel({ agents }: AgentHealthPanelProps) {
  return (
    <DashboardPanel description="1 minute heartbeat window" title="Agent health">
      <div className="h-[280px] overflow-auto pr-1">
        {agents.length === 0 ? (
          <EmptyState message="No ingestion agent has connected yet." />
        ) : (
          <ItemGroup className="gap-2" data-size="sm">
            {agents.map((agent) => (
              <AgentHealthItem agent={agent} key={agent.id} />
            ))}
          </ItemGroup>
        )}
      </div>
    </DashboardPanel>
  );
}

function AgentHealthItem({ agent }: AgentHealthItemProps) {
  return (
    <Item size="sm" variant="outline">
      <ItemMedia>
        <span
          aria-label={agent.online ? "Online" : "Offline"}
          className={`size-2 rounded-full ${agent.online ? "bg-emerald-500" : "bg-destructive"}`}
          role="status"
        />
      </ItemMedia>
      <ItemContent className="min-w-0">
        <ItemTitle className="max-w-full truncate">
          <Link
            className="underline-offset-4 hover:underline"
            params={{ agentId: agent.id }}
            to="/agents/$agentId"
          >
            {agent.id}
          </Link>
        </ItemTitle>
        <ItemDescription className="truncate text-xs">
          {agent.version ? `v${agent.version} · ` : ""}seen {relativeTime(agent.lastSeenAt)}
        </ItemDescription>
      </ItemContent>
      <ItemActions>
        <Badge variant={stateVariant(agent.state)}>{agent.state}</Badge>
      </ItemActions>
    </Item>
  );
}
