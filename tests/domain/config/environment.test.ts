import { afterEach, describe, expect, test } from "bun:test";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import {
  normalizeNodeEnvironment,
  readEnvFiles,
  resolveEnvFiles,
} from "../../../packages/domain/src/config/environment";

const temporaryDirectories: string[] = [];

afterEach(() => {
  for (const directory of temporaryDirectories.splice(0)) {
    fs.rmSync(directory, { force: true, recursive: true });
  }
});

describe("normalizeNodeEnvironment", () => {
  test.each([
    ["development", "development"],
    ["test", "test"],
    ["production", "production"],
  ] as const)("normalizes %s to %s", (value, expected) => {
    expect(normalizeNodeEnvironment(value)).toBe(expected);
  });

  test.each(["dev", "prod"])("rejects unsupported value %s", (value) => {
    expect(() => normalizeNodeEnvironment(value)).toThrow(`Unsupported NODE_ENV: ${value}`);
  });
});

describe("environment files", () => {
  test("loads base, mode, then local values", () => {
    const directory = createEnvironmentDirectory({
      ".env": "VALUE=base\nBASE_ONLY=yes\n",
      ".env.local": "VALUE=local\nLOCAL_ONLY=yes\n",
      ".env.prod": "VALUE=production\nMODE_ONLY=yes\n",
    });

    expect(readEnvFiles({ cwd: directory, nodeEnvironment: "production" })).toEqual({
      BASE_ONLY: "yes",
      LOCAL_ONLY: "yes",
      MODE_ONLY: "yes",
      VALUE: "local",
    });
  });

  test.each([
    ["development", ".env.dev"],
    ["test", ".env.test"],
    ["production", ".env.prod"],
  ] as const)("selects %s mode file", (mode, expectedFile) => {
    const directory = createEnvironmentDirectory({ ".env": "VALUE=base\n" });
    const files = resolveEnvFiles({ cwd: directory, nodeEnvironment: mode });

    expect(files.map((file) => path.basename(file.path))).toEqual([
      ".env",
      expectedFile,
      ".env.local",
    ]);
  });

  test("uses NODE_ENV from the base file when no mode is provided", () => {
    const directory = createEnvironmentDirectory({
      ".env": "NODE_ENV=production\nVALUE=base\n",
      ".env.prod": "VALUE=production\n",
    });
    const previousNodeEnvironment = process.env.NODE_ENV;
    delete process.env.NODE_ENV;

    try {
      expect(readEnvFiles({ cwd: directory }).VALUE).toBe("production");
    } finally {
      if (previousNodeEnvironment === undefined) {
        delete process.env.NODE_ENV;
      } else {
        process.env.NODE_ENV = previousNodeEnvironment;
      }
    }
  });
});

function createEnvironmentDirectory(files: Record<string, string>): string {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "basango-env-"));
  temporaryDirectories.push(directory);

  for (const [fileName, content] of Object.entries(files)) {
    fs.writeFileSync(path.join(directory, fileName), content);
  }

  return directory;
}
