import type { IngestionChange, IngestionChangeTopic } from "@basango/domain/models";
import { OpenAPIHono } from "@hono/zod-openapi";
import { streamSSE } from "hono/streaming";

import type { Context } from "#api/rest/init";
import { withAdminSession } from "#api/rest/middlewares/session";
import { subscribeToIngestionChanges } from "#api/services/ingestion/signals";

const app = new OpenAPIHono<Context>();

app.get("/stream", withAdminSession, (c) =>
  streamSSE(c, async (stream) => {
    const pendingTopics = new Set<IngestionChangeTopic>();
    let latestSignalId: string | undefined;
    let closed = false;
    let wake: () => void = () => undefined;
    let signal = new Promise<void>((resolve) => {
      wake = resolve;
    });
    const unsubscribe = subscribeToIngestionChanges((change) => {
      for (const topic of change.topics) {
        pendingTopics.add(topic);
      }

      latestSignalId = change.latestSignalId;
      wake();
    });

    stream.onAbort(() => {
      closed = true;
      unsubscribe();
      wake();
    });

    try {
      await stream.writeSSE({ data: "connected", event: "ready", retry: 3_000 });

      while (!closed) {
        await Promise.race([signal, stream.sleep(15_000)]);
        signal = new Promise<void>((resolve) => {
          wake = resolve;
        });

        if (!latestSignalId || pendingTopics.size === 0) {
          await stream.writeSSE({ data: new Date().toISOString(), event: "heartbeat" });
          continue;
        }

        const change: IngestionChange = {
          latestSignalId,
          topics: [...pendingTopics],
        };
        latestSignalId = undefined;
        pendingTopics.clear();

        await stream.writeSSE({
          data: JSON.stringify(change),
          event: "ingestion-update",
          id: change.latestSignalId,
        });
      }
    } finally {
      unsubscribe();
    }
  }),
);

export const ingestionOperationsRouter = app;
