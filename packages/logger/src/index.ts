import pino from "pino";

export const logger = pino({
  level: process.env.LOG_LEVEL || "debug",
  // Use pretty printing in development, structured JSON in production
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
