import z from "zod";

export const DatabaseConfigurationSchema = z.object({
  legacy: z.object({
    host: z.string().min(1),
    name: z.string().min(1),
    password: z.string().min(1),
    port: z.number().optional(),
    user: z.string().min(1),
  }),
  url: z.string().min(1),
});

// types
export type DatabaseConfiguration = z.infer<typeof DatabaseConfigurationSchema>;
