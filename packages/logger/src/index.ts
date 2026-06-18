import { createRequire } from "node:module";

import { config } from "@basango/domain/config";
import type pino from "pino";

declare const BASANGO_CRAWLER_BINARY: boolean | undefined;

type LogLevel = "trace" | "debug" | "info" | "warn" | "error" | "fatal";
type LogMethod = (messageOrData?: unknown, message?: string) => void;

interface LoggerLike {
  child: (...args: unknown[]) => LoggerLike;
  debug: LogMethod;
  error: LogMethod;
  fatal: LogMethod;
  info: LogMethod;
  trace: LogMethod;
  warn: LogMethod;
}

const shouldUseBinaryLogger =
  typeof BASANGO_CRAWLER_BINARY !== "undefined" && BASANGO_CRAWLER_BINARY === true;

const levels: Record<LogLevel, number> = {
  debug: 20,
  error: 50,
  fatal: 60,
  info: 30,
  trace: 10,
  warn: 40,
};

const normalizeLogInput = (messageOrData?: unknown, message?: string) => {
  if (typeof messageOrData === "string") {
    return { data: undefined, message: messageOrData };
  }

  return { data: messageOrData, message };
};

const serializeValue = (value: unknown): unknown => {
  if (value instanceof Error) {
    return {
      message: value.message,
      name: value.name,
      stack: value.stack,
    };
  }

  return value;
};

const createBinaryLogger = (): LoggerLike => {
  const configuredLevel = (
    config.logger.level in levels ? config.logger.level : "info"
  ) as LogLevel;
  const minimumLevel = levels[configuredLevel];

  const write = (level: LogLevel, messageOrData?: unknown, message?: string) => {
    if (levels[level] < minimumLevel) {
      return;
    }

    const input = normalizeLogInput(messageOrData, message);
    const data =
      input.data && typeof input.data === "object"
        ? Object.fromEntries(
            Object.entries(input.data).map(([key, value]) => [key, serializeValue(value)]),
          )
        : {};
    const payload = {
      level: levels[level],
      time: Date.now(),
      ...data,
      msg: input.message,
    };
    const target = level === "error" || level === "fatal" ? process.stderr : process.stdout;

    target.write(`${JSON.stringify(payload)}\n`);
  };

  const logger: LoggerLike = {
    child: () => logger,
    debug: (data, message) => write("debug", data, message),
    error: (data, message) => write("error", data, message),
    fatal: (data, message) => write("fatal", data, message),
    info: (data, message) => write("info", data, message),
    trace: (data, message) => write("trace", data, message),
    warn: (data, message) => write("warn", data, message),
  };

  return logger;
};

const createPinoLogger = (): LoggerLike => {
  const require = createRequire(import.meta.url);
  const createLogger = require("pino") as typeof pino;

  return createLogger({
    level: config.logger.level,
    ...(process.env.NODE_ENV !== "production" &&
      process.env.BASANGO_LOGGER_PRETTY === "true" && {
        transport: {
          options: {
            colorize: true,
            hideObject: false,
            ignore: "pid,hostname",
            messageFormat: true,
            translateTime: "HH:MM:ss",
          },
          target: "pino-pretty",
        },
      }),
  }) as unknown as LoggerLike;
};

export const logger = shouldUseBinaryLogger ? createBinaryLogger() : createPinoLogger();

export default logger;
