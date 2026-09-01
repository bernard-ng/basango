import { describe, expect, test } from "bun:test";

import { config } from "@basango/domain/config";

import { withMcpAuth } from "#api/mcp/middlewares/auth";

const requestHandler = withMcpAuth(() => Response.json({ authenticated: true }));

describe("MCP bearer authentication", () => {
  test("calls the wrapped handler for the configured bearer token", async () => {
    const response = await requestHandler(
      new Request("https://api.basango.test/mcp", {
        headers: { Authorization: `Bearer ${config.api.security.mcpToken}` },
      }),
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ authenticated: true });
  });

  test("rejects missing and invalid bearer tokens", async () => {
    const invalid = await requestHandler(
      new Request("https://api.basango.test/mcp", {
        headers: { Authorization: "Bearer wrong-token" },
      }),
    );
    const missing = await requestHandler(new Request("https://api.basango.test/mcp"));

    expect(invalid.status).toBe(401);
    expect(missing.status).toBe(401);
  });

  test("rejects malformed authorization headers", async () => {
    const basic = await requestHandler(
      new Request("https://api.basango.test/mcp", {
        headers: { Authorization: `Basic ${config.api.security.mcpToken}` },
      }),
    );
    const extra = await requestHandler(
      new Request("https://api.basango.test/mcp", {
        headers: { Authorization: `Bearer ${config.api.security.mcpToken} extra` },
      }),
    );
    const lowercase = await requestHandler(
      new Request("https://api.basango.test/mcp", {
        headers: { Authorization: `bearer ${config.api.security.mcpToken}` },
      }),
    );

    expect(basic.status).toBe(401);
    expect(extra.status).toBe(401);
    expect(lowercase.status).toBe(200);
  });

  test("returns a discoverable no-store bearer challenge", async () => {
    const response = await requestHandler(new Request("https://api.basango.test/mcp"));

    expect(response.status).toBe(401);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(response.headers.get("www-authenticate")).toBe('Bearer realm="basango-mcp"');
    expect(await response.json()).toMatchObject({ error: "invalid_token" });
  });
});
