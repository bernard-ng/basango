import z from "zod";

import { idSchema, paginationRequestSchema } from "../shared";

export const SourceListSchema = paginationRequestSchema.extend({
  followedOnly: z.boolean().optional(),
  search: z.string().trim().max(255).optional(),
});

export const SourceSchema = z.object({
  id: idSchema,
});

export type Source = z.infer<typeof SourceSchema>;
export type SourceList = z.infer<typeof SourceListSchema>;
