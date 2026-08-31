"use client";

import {
  type IngestionChange,
  type IngestionChangeTopic,
  ingestionChangeSchema,
} from "@basango/domain/models";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";

import { getPublicApiUrl } from "#dashboard/app/environment";
import { useTRPC } from "#dashboard/app/trpc/client";

const REFRESH_COALESCE_MS = 750;
const AGENT_ONLINE_WINDOW_MS = 60_000;
const ALL_CHANGE_TOPICS: readonly IngestionChangeTopic[] = [
  "agents",
  "runs",
  "summary",
  "throughput",
];
const realtimeQueryOptions = {
  refetchOnReconnect: false,
  refetchOnWindowFocus: false,
  retry: false,
  trpc: { context: { realtime: true } },
} as const;

type ConnectionStatus = "connecting" | "disconnected" | "live";

export function useIngestionOverview() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>("connecting");
  const [livenessNow, setLivenessNow] = useState(() => Date.now());
  const agents = useQuery(
    trpc.operations.getIngestionAgents.queryOptions(undefined, realtimeQueryOptions),
  );
  const summary = useQuery(
    trpc.operations.getIngestionSummary.queryOptions(undefined, realtimeQueryOptions),
  );
  const throughput = useQuery(
    trpc.operations.getIngestionThroughput.queryOptions(undefined, realtimeQueryOptions),
  );

  useEffect(() => {
    const dirtyTopics = new Set<IngestionChangeTopic>();
    let connected = false;
    let active = true;
    let refreshInFlight = false;
    let needsReconciliation = false;
    let refreshTimer: ReturnType<typeof setTimeout> | undefined;

    function scheduleRefresh(topics: readonly IngestionChangeTopic[]) {
      if (!connected || !active) {
        return;
      }

      for (const topic of topics) {
        dirtyTopics.add(topic);
      }

      refreshTimer ??= setTimeout(flushRefresh, REFRESH_COALESCE_MS);
    }

    async function flushRefresh() {
      refreshTimer = undefined;

      if (!connected || !active || refreshInFlight || dirtyTopics.size === 0) {
        return;
      }

      const topics = [...dirtyTopics];
      dirtyTopics.clear();
      refreshInFlight = true;

      await Promise.allSettled(topics.map(refreshTopic));
      refreshInFlight = false;

      if (connected && dirtyTopics.size > 0) {
        scheduleRefresh([]);
      }
    }

    function refreshTopic(topic: IngestionChangeTopic) {
      const options = { cancelRefetch: false };

      if (topic === "agents") {
        return queryClient.refetchQueries(
          trpc.operations.getIngestionAgents.queryFilter(),
          options,
        );
      }

      if (topic === "runs") {
        return queryClient.refetchQueries(trpc.operations.listIngestionRuns.queryFilter(), options);
      }

      if (topic === "summary") {
        return queryClient.refetchQueries(
          trpc.operations.getIngestionSummary.queryFilter(),
          options,
        );
      }

      return queryClient.refetchQueries(
        trpc.operations.getIngestionThroughput.queryFilter(),
        options,
      );
    }

    const eventSource = new EventSource(`${getPublicApiUrl()}/operations/ingestion/stream`, {
      withCredentials: true,
    });

    eventSource.onopen = () => {
      connected = true;
      setLivenessNow(Date.now());
      setConnectionStatus("live");

      if (needsReconciliation) {
        needsReconciliation = false;
        scheduleRefresh(ALL_CHANGE_TOPICS);
      }
    };
    eventSource.onerror = () => {
      connected = false;
      needsReconciliation = true;
      dirtyTopics.clear();

      if (refreshTimer) {
        clearTimeout(refreshTimer);
        refreshTimer = undefined;
      }

      setConnectionStatus("disconnected");
    };

    function handleIngestionUpdate(event: MessageEvent<string>) {
      const change = parseIngestionChange(event.data);

      if (change) {
        scheduleRefresh(change.topics);
      }
    }

    function handleHeartbeat() {
      setLivenessNow(Date.now());
    }

    eventSource.addEventListener("heartbeat", handleHeartbeat);
    eventSource.addEventListener("ingestion-update", handleIngestionUpdate);

    return () => {
      active = false;
      connected = false;

      if (refreshTimer) {
        clearTimeout(refreshTimer);
      }

      eventSource.removeEventListener("heartbeat", handleHeartbeat);
      eventSource.removeEventListener("ingestion-update", handleIngestionUpdate);
      eventSource.close();
    };
  }, [queryClient, trpc]);

  const data =
    agents.data && summary.data && throughput.data
      ? {
          agents: agents.data.agents.map((agent) => {
            const online = livenessNow - agent.lastSeenAt.getTime() <= AGENT_ONLINE_WINDOW_MS;

            return {
              ...agent,
              online,
              state: online ? agent.state : ("offline" as const),
            };
          }),
          summary: summary.data,
          throughput: throughput.data,
        }
      : undefined;

  return {
    connectionStatus,
    data,
    isPending: agents.isPending || summary.isPending || throughput.isPending,
  };
}

function parseIngestionChange(data: string): IngestionChange | undefined {
  try {
    return ingestionChangeSchema.parse(JSON.parse(data));
  } catch {
    return undefined;
  }
}
