import z from "zod";

export const DatabaseConfigurationSchema = z.object({
  url: z.string().min(1),
});

// types
export type DatabaseConfiguration = z.infer<typeof DatabaseConfigurationSchema>;
