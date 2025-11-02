import fs from "node:fs";
import path from "node:path";

import type { RedisOptions } from "ioredis";
import { get_encoding, TiktokenEncoding } from "tiktoken";
import { format, getUnixTime, isMatch, parse } from "date-fns";
import { z } from "zod";

import {
  CreateDateRangeOptions,
  DateRange,
  DateRangeSchema,
  DateRangeSpecSchema,
  PipelineConfig,
  ProjectPaths,
  ProjectPathsSchema,
  SourcesConfig,
  SourcesConfigSchema,
} from "@/schema";
import { DEFAULT_DATE_FORMAT } from "@/constants";

export const ensureDirectories = (paths: ProjectPaths): void => {
  for (const dir of [paths.data, paths.logs, paths.configs]) {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }
};

export const parseRedisUrl = (url: string): RedisOptions => {
  if (!url.startsWith("redis://")) {
    return {};
  }
  const parsed = new URL(url);
  return {
    host: parsed.hostname,
    port: Number(parsed.port || 6379),
    password: parsed.password || undefined,
    db: Number(parsed.pathname?.replace("/", "") || 0),
  };
};

export const countTokens = (
  text: string,
  encoding: TiktokenEncoding = "cl100k_base",
): number => {
  try {
    const encoder = get_encoding(encoding);
    const tokens = encoder.encode(text);
    encoder.free();
    return tokens.length;
  } catch {
    return text.length;
  }
};

const parseDate = (value: string, format: string): Date => {
  if (!isMatch(value, format)) {
    throw new Error(`Invalid date '${value}' for format '${format}'`);
  }
  const parsed = parse(value, format, new Date());
  if (Number.isNaN(parsed.getTime())) {
    throw new Error(`Invalid date '${value}' for format '${format}'`);
  }
  return parsed;
};

export const createDateRange = (
  spec: string,
  options: CreateDateRangeOptions = {},
): DateRange => {
  const { format = DEFAULT_DATE_FORMAT, separator = ":" } = options;
  if (!separator) {
    throw new Error("Separator cannot be empty");
  }

  const normalized = spec.replace(separator, ":");
  const parsedSpec = DateRangeSpecSchema.parse(normalized);

  const startDate = parseDate(parsedSpec.startRaw, format);
  const endDate = parseDate(parsedSpec.endRaw, format);

  const range = {
    start: getUnixTime(startDate),
    end: getUnixTime(endDate),
  };

  return DateRangeSchema.parse(range);
};

export const formatDateRange = (
  range: DateRange,
  fmt = DEFAULT_DATE_FORMAT,
): string => {
  const start = format(new Date(range.start * 1000), fmt);
  const end = format(new Date(range.end * 1000), fmt);
  return `${start}:${end}`;
};

export const isTimestampInRange = (
  range: DateRange,
  timestamp: number,
): boolean => {
  return range.start <= timestamp && timestamp <= range.end;
};

export const resolveProjectPaths = (rootDir: string): ProjectPaths => {
  return ProjectPathsSchema.parse({
    root: rootDir,
    data: path.join(rootDir, "data", "dataset"),
    logs: path.join(rootDir, "data", "logs"),
    configs: path.join(rootDir, "config"),
  });
};

export const createSourcesConfig = (input: unknown): SourcesConfig => {
  const parsed = SourcesConfigSchema.parse(input);
  const resolver = (sourceId: string) =>
    [...parsed.html, ...parsed.wordpress].find(
      (source) => source.source_id === sourceId,
    );
  return Object.assign({ find: resolver }, parsed);
};

export const mergePipelineConfig = (
  base: PipelineConfig,
  overrides: Partial<PipelineConfig>,
): PipelineConfig => {
  const paths = overrides.paths ?? base.paths;
  const logging = { ...base.logging, ...(overrides.logging ?? {}) };
  const fetch = {
    client: { ...base.fetch.client, ...(overrides.fetch?.client ?? {}) },
    crawler: { ...base.fetch.crawler, ...(overrides.fetch?.crawler ?? {}) },
  };

  const sources = createSourcesConfig({
    html: overrides.sources?.html ?? base.sources.html,
    wordpress: overrides.sources?.wordpress ?? base.sources.wordpress,
  });

  return {
    paths,
    logging,
    fetch,
    sources,
  };
};

export const resolveConfigPath = (basePath: string, env?: string): string => {
  if (!env || env === "development") {
    return basePath;
  }

  const ext = path.extname(basePath);
  const withoutExt = basePath.slice(0, basePath.length - ext.length);
  return `${withoutExt}.${env}${ext}`;
};
export const schemaToJSON = <T extends z.ZodTypeAny>(schema: T): unknown => {
  const toJSONSchema = (z as any).toJSONSchema as
    | ((s: z.ZodTypeAny, opts?: Record<string, unknown>) => unknown)
    | undefined;

  if (typeof toJSONSchema === "function") {
    try {
      // target can be "draft-2020-12" | "draft-7" | "draft-4" | "openapi-3.0"
      return toJSONSchema(schema, {
        target: "draft-2020-12",
        unrepresentable: "any",
      });
    } catch {
      // fall through to minimal mapping
    }
  }

  if (schema instanceof z.ZodObject) return { type: "object" };
  if (schema instanceof z.ZodArray) return { type: "array" };
  if (schema instanceof z.ZodString) return { type: "string" };
  if (schema instanceof z.ZodNumber) return { type: "number" };
  if (schema instanceof z.ZodBoolean) return { type: "boolean" };

  return { type: "unknown" };
};
