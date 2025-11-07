import pino from "pino";

export const logger = pino({
  level: process.env.LOG_LEVEL || "debug",
  // Use pretty printing in development, structured JSON in production
  ...(process.env.NODE_ENV !== "production" && {
    transport: {
      target: "pino-pretty",
      options: {
        colorize: true,
        translateTime: "HH:MM:ss",
        ignore: "pid,hostname",
        messageFormat: true,
        hideObject: false,
      },
    },
  }),
});

export default logger;
