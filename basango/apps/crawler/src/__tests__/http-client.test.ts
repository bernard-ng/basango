import { describe, expect, it, vi } from "vitest";

import { ClientConfigSchema } from "@/schema";
import { HttpError, SyncHttpClient } from "@/http/http-client";

const createConfig = () =>
  ClientConfigSchema.parse({
    timeout: 1,
    max_retries: 2,
    backoff_initial: 0.001,
    backoff_multiplier: 2,
    backoff_max: 0.01,
  });

describe("SyncHttpClient", () => {
  it("retries transient statuses", async () => {
    const config = createConfig();
    const sleep = vi.fn().mockResolvedValue(undefined);
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response("retry", { status: 503 }))
      .mockResolvedValueOnce(new Response("ok", { status: 200, body: "done" }));

    const client = new SyncHttpClient(config, { fetchImpl: fetchMock, sleep });
    const response = await client.get("https://example.com");

    expect(await response.text()).toBe("done");
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(sleep).toHaveBeenCalled();
  });

  it("respects retry-after header", async () => {
    const config = createConfig();
    const sleep = vi.fn().mockResolvedValue(undefined);
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response("retry", { status: 503, headers: { "Retry-After": "3" } }),
      )
      .mockResolvedValueOnce(new Response("ok", { status: 200 }));

    const client = new SyncHttpClient(config, { fetchImpl: fetchMock, sleep });
    await client.get("https://example.com");

    expect(sleep).toHaveBeenCalledWith(3000);
  });

  it("throws http error on non transient failure", async () => {
    const config = createConfig();
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response("bad", { status: 404, statusText: "Not Found" }));

    const client = new SyncHttpClient(config, { fetchImpl: fetchMock });

    await expect(client.get("https://example.com"))
      .rejects.toBeInstanceOf(HttpError);
  });

  it("sends json payload and query params", async () => {
    const config = createConfig();
    const fetchMock = vi
      .fn()
      .mockResolvedValue(new Response("ok", { status: 200 }));

    const client = new SyncHttpClient(config, { fetchImpl: fetchMock });
    await client.post("https://example.com/api", {
      params: { page: 1, q: "news" },
      json: { hello: "world" },
      headers: { Authorization: "token" },
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0]!;
    expect(url).toBe("https://example.com/api?page=1&q=news");
    expect(init?.method).toBe("POST");
    expect(init?.body).toBe(JSON.stringify({ hello: "world" }));
    expect((init?.headers as Record<string, string>)["Authorization"]).toBe("token");
    expect((init?.headers as Record<string, string>)["Content-Type"]).toBe(
      "application/json",
    );
  });
});
