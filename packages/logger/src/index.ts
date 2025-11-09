import { createEnvAccessor } from "@devscast/config";
import pino from "pino";

const env = createEnvAccessor(["LOG_LEVEL", "NODE_ENV"] as const);

export const logger = pino({
  level: env("LOG_LEVEL", { default: "info" }),
  // Use pretty printing in development, structured JSON in production
  ...(env("NODE_ENV") !== "production" && {
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
});

export default logger;
