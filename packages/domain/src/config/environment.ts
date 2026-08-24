import fs from "node:fs";
import path from "node:path";
import { parseEnv } from "node:util";

export const findEnvPath = (): string => {
  const configured = process.env.BASANGO_ENV_PATH?.trim();
  if (configured) {
    return path.resolve(configured);
  }

  let current = process.cwd();
  while (true) {
    const candidate = path.join(current, ".env");
    if (fs.existsSync(candidate)) {
      return candidate;
    }

    const parent = path.dirname(current);
    if (parent === current) {
      return path.join(process.cwd(), ".env");
    }
    current = parent;
  }
};

export const readEnvFile = (envPath = findEnvPath()): Record<string, string | undefined> => {
  if (!fs.existsSync(envPath)) {
    return {};
  }

  return parseEnv(fs.readFileSync(envPath, "utf8"));
};
