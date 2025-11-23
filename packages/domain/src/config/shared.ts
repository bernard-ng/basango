import z from "zod";

export const SharedConfigurationSchema = z.object({
  categorySharesLimit: z.number().int().min(1).default(10),
  dateFormat: z.string(),
  dateTimeFormat: z.string(),
  name: z.string().default("Basango"),
  pagination: z.object({
    defaultLimit: z.number().int().min(1).max(100),
    maxLimit: z.number().int().min(1).max(100),
    page: z.number().int().min(1),
  }),
  publicationGraphDays: z.number().int().min(1),
  timezone: z.string(),
});

export type SharedConfiguration = z.infer<typeof SharedConfigurationSchema>;
