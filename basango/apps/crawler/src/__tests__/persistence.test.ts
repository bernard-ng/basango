import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { JsonlPersistor } from "@/persistence";

describe("JsonlPersistor", () => {
  it("writes json lines sequentially", async () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "jsonl-test-"));
    const persistor = new JsonlPersistor({ directory: tempDir, sourceId: "demo" });

    await Promise.all([
      persistor.persist({ id: 1, title: "first" }),
      persistor.persist({ id: 2, title: "second" }),
    ]);

    await persistor.close();

    const contents = fs.readFileSync(path.join(tempDir, "demo.jsonl"), "utf-8");
    const lines = contents.trim().split("\n").map((line) => JSON.parse(line));

    expect(lines).toContainEqual({ id: 1, title: "first" });
    expect(lines).toContainEqual({ id: 2, title: "second" });
  });
});
