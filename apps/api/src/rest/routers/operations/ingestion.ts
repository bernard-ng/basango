import { OpenAPIHono } from "@hono/zod-openapi";
import { streamSSE } from "hono/streaming";

import type { Context } from "#api/rest/init";
import { withAdminSession } from "#api/rest/middlewares/session";
import { subscribeToIngestionChanges } from "#api/services/ingestion/signals";

const app = new OpenAPIHono<Context>();

app.get("/stream", withAdminSession, (c) =>
  streamSSE(c, async (stream) => {
    const pending: string[] = [];
    let closed = false;
    let wake: () => void = () => undefined;
    let signal = new Promise<void>((resolve) => {
      wake = resolve;
    });
    const unsubscribe = subscribeToIngestionChanges((signalId) => {
      pending.push(signalId);
      wake();
    });

    stream.onAbort(() => {
      closed = true;
      unsubscribe();
      wake();
    });

    try {
      await stream.writeSSE({ data: "connected", event: "ready" });

      while (!closed) {
        await Promise.race([signal, stream.sleep(15_000)]);
        signal = new Promise<void>((resolve) => {
          wake = resolve;
        });

        if (pending.length === 0) {
          await stream.writeSSE({ data: new Date().toISOString(), event: "heartbeat" });
          continue;
        }

        for (const signalId of pending.splice(0)) {
          await stream.writeSSE({
            data: signalId,
            event: "ingestion-update",
            id: signalId,
          });
        }
      }
    } finally {
      unsubscribe();
    }
  }),
);

export const ingestionOperationsRouter = app;
