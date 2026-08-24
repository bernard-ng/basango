"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";

import { getPublicApiUrl } from "#dashboard/app/environment";
import { useTRPC } from "#dashboard/app/trpc/client";

export function useIngestionOverview() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const [streamConnected, setStreamConnected] = useState(false);
  const query = useQuery({
    ...trpc.operations.getIngestionOverview.queryOptions(),
    refetchInterval: 15_000,
  });

  useEffect(() => {
    const controller = new AbortController();

    const connect = async () => {
      while (!controller.signal.aborted) {
        try {
          const response = await fetch(`${getPublicApiUrl()}/operations/ingestion/stream`, {
            credentials: "include",
            signal: controller.signal,
          });
          if (!response.ok || !response.body) throw new Error("Ingestion stream unavailable");

          setStreamConnected(true);
          const reader = response.body.getReader();
          const decoder = new TextDecoder();
          let buffer = "";
          while (!controller.signal.aborted) {
            const { done, value } = await reader.read();
            if (done) break;
            buffer += decoder.decode(value, { stream: true });
            const messages = buffer.split("\n\n");
            buffer = messages.pop() ?? "";
            if (messages.some((message) => message.includes("event: ingestion-update"))) {
              void query.refetch();
              void queryClient.invalidateQueries(trpc.operations.listIngestionRuns.queryFilter());
            }
          }
          setStreamConnected(false);
        } catch {
          if (controller.signal.aborted) break;
          setStreamConnected(false);
        }

        await new Promise((resolve) => setTimeout(resolve, 3_000));
      }
    };

    void connect();
    return () => controller.abort();
  }, [query.refetch, queryClient, trpc.operations.listIngestionRuns]);

  return {
    data: query.data,
    isPending: query.isPending,
    streamConnected,
  };
}
