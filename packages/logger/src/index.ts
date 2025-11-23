import { config } from "@basango/domain/config";
import pino from "pino";

export const logger = pino({
  level: config.logger.level,
  ...(process.env.NODE_ENV !== "production" && {
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
