import fs from "node:fs";
import path from "node:path";
import { parseEnv } from "node:util";

export type NodeEnvironment = "development" | "test" | "production";

export interface EnvironmentFileOptions {
  cwd?: string;
  envPath?: string;
  nodeEnvironment?: string;
}

interface EnvironmentFile {
  optional: boolean;
  path: string;
}

const environmentFileSuffixes: Record<NodeEnvironment, string> = {
  development: "dev",
  production: "prod",
  test: "test",
};

export function normalizeNodeEnvironment(value?: string): NodeEnvironment {
  switch (value?.trim().toLowerCase()) {
    case undefined:
    case "":
    case "development":
      return "development";
    case "test":
      return "test";
    case "production":
      return "production";
    default:
      throw new Error(`Unsupported NODE_ENV: ${value}`);
  }
}

export function findEnvPath(cwd = process.cwd()): string {
  const configured = process.env.BASANGO_ENV_PATH?.trim();
  if (configured) {
    return path.resolve(configured);
  }

  let current = path.resolve(cwd);
  while (true) {
    const candidate = path.join(current, ".env");
    if (fs.existsSync(candidate)) {
      return candidate;
    }

    const parent = path.dirname(current);
    if (parent === current) {
      return path.join(path.resolve(cwd), ".env");
    }
    current = parent;
  }
}

export function resolveEnvFiles(options: EnvironmentFileOptions = {}): EnvironmentFile[] {
  const envPath = path.resolve(options.envPath ?? findEnvPath(options.cwd));
  const baseEnvironment = readOptionalEnvFile(envPath);
  const nodeEnvironment = normalizeNodeEnvironment(
    options.nodeEnvironment ?? process.env.NODE_ENV ?? baseEnvironment.NODE_ENV,
  );
  const directory = path.dirname(envPath);
  const paths = [
    envPath,
    path.join(directory, `.env.${environmentFileSuffixes[nodeEnvironment]}`),
    path.join(directory, ".env.local"),
  ];

  return [...new Set(paths)].map((filePath, index) => ({
    optional: index > 0,
    path: filePath,
  }));
}

export function readEnvFiles(
  options: EnvironmentFileOptions = {},
): Record<string, string | undefined> {
  const environment: Record<string, string | undefined> = {};

  for (const file of resolveEnvFiles(options)) {
    if (!fs.existsSync(file.path)) {
      if (file.optional) {
        continue;
      }

      throw new Error(`Environment file not found: ${file.path}`);
    }

    Object.assign(environment, parseEnv(fs.readFileSync(file.path, "utf8")));
  }

  return environment;
}

function readOptionalEnvFile(filePath: string): Record<string, string | undefined> {
  if (!fs.existsSync(filePath)) {
    return {};
  }

  return parseEnv(fs.readFileSync(filePath, "utf8"));
}
