import { PageRangeSchema, TimestampRangeSchema, articleSchema } from "@basango/domain/models";
import { z } from "zod";

export const ListingTaskPayloadSchema = z.object({
  category: z.string().optional(),
  dateRange: z.string().optional(),
  pageRange: z.string().optional(),
  sourceId: z.string(),
});

export const DetailsTaskPayloadSchema = z.object({
  category: z.string().optional(),
  data: z.any().optional(),
  dateRange: TimestampRangeSchema.optional(),
  page: z.number().int().nonnegative().optional(),
  pageRange: PageRangeSchema.optional(),
  sourceId: z.string(),
  url: z.url(),
});

export const ProcessingTaskPayloadSchema = z.object({
  article: articleSchema,
  sourceId: z.string(),
});

export type ListingTaskPayload = z.infer<typeof ListingTaskPayloadSchema>;
export type DetailsTaskPayload = z.infer<typeof DetailsTaskPayloadSchema>;
export type ProcessingTaskPayload = z.infer<typeof ProcessingTaskPayloadSchema>;
