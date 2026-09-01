import { afterEach, describe, expect, test } from "bun:test";

import { config } from "@basango/domain/config";
import { Client, StreamableHTTPClientTransport } from "@modelcontextprotocol/client";

import api from "#api/index";

let activeClient: Client | undefined;

async function apiFetch(input: string | URL | Request, init?: RequestInit) {
  return await api.fetch(new Request(input, init));
}

afterEach(async () => {
  await activeClient?.close();
  activeClient = undefined;
});

describe("MCP HTTP endpoint", () => {
  test("rejects requests without the dedicated bearer token", async () => {
    const response = await apiFetch("http://localhost:3080/mcp", {
      body: JSON.stringify({ id: 1, jsonrpc: "2.0", method: "tools/list" }),
      headers: { "Content-Type": "application/json" },
      method: "POST",
    });

    expect(response.status).toBe(401);
    expect(response.headers.get("www-authenticate")).toContain("basango-mcp");
  });

  test("serves the registered tools over authenticated Streamable HTTP", async () => {
    const transport = new StreamableHTTPClientTransport(new URL("http://localhost:3080/mcp"), {
      authProvider: {
        token: async () => config.api.security.mcpToken,
      },
      fetch: apiFetch,
    });
    const client = new Client({ name: "basango-http-test", version: "1.0.0" });
    activeClient = client;

    await client.connect(transport);
    const response = await client.listTools();

    expect(response.tools.map((tool) => tool.name)).toContain("list_articles");
    expect(response.tools.map((tool) => tool.name)).toContain("list_sources");
  });

  test("allows browser preflight for MCP protocol and authorization headers", async () => {
    const response = await apiFetch("http://localhost:3080/mcp", {
      headers: {
        "Access-Control-Request-Headers": "Authorization,MCP-Protocol-Version,Mcp-Method,Mcp-Name",
        "Access-Control-Request-Method": "POST",
        Origin: "http://localhost:3001",
      },
      method: "OPTIONS",
    });

    expect(response.status).toBe(204);
    expect(response.headers.get("access-control-allow-headers")).toContain("MCP-Protocol-Version");
  });
});
