import z from "zod";

export const ApiConfigurationSchema = z.object({
  cors: z.object({
    allowedHeaders: z.array(z.string()).default([]),
    allowMethods: z.array(z.string()).default([]),
    exposeHeaders: z.array(z.string()).default([]),
    maxAge: z.number().int().min(0).optional(),
    origin: z
      .array(z.string())
      .optional()
      .default(["http://localhost:3000", "http://127.0.0.1:3000", "https://dashboard.basango.io"]),
  }),
  security: z.object({
    accessTokenTtl: z.string(),
    audience: z.string(),
    crawlerToken: z.string(),
    issuer: z.string(),
    jwtSecret: z.string(),
    refreshTokenTtl: z.string(),
  }),
  server: z.object({
    host: z.string().default("localhost"),
    port: z.number().int().min(1).max(65535).default(3080),
    version: z.string().default("1.0.0"),
  }),
});

export type ApiConfiguration = z.infer<typeof ApiConfigurationSchema>;
