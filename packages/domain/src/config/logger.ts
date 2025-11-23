import z from "zod";

export const LoggerConfigurationSchema = z.object({
  level: z.string().default("info"),
});

// types
export type LoggerConfiguration = z.infer<typeof LoggerConfigurationSchema>;
