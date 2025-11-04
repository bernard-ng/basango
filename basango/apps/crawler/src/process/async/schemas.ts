import { z } from "zod";
import { ArticleSchema, DateRangeSchema, PageRangeSchema } from "@/schema";

export const ListingTaskPayloadSchema = z.object({
  sourceId: z.string(),
  pageRange: z.string().optional(),
  dateRange: z.string().optional(),
  category: z.string().optional(),
});

export const DetailsTaskPayloadSchema = z.object({
  sourceId: z.string(),
  url: z.url(),
  data: z.any().optional(),
  page: z.number().int().nonnegative().optional(),
  pageRange: PageRangeSchema.optional(),
  dateRange: DateRangeSchema.optional(),
  category: z.string().optional(),
});

export const ProcessingTaskPayloadSchema = z.object({
  sourceId: z.string(),
  article: ArticleSchema,
});

export type ListingTaskPayload = z.infer<typeof ListingTaskPayloadSchema>;
export type DetailsTaskPayload = z.infer<typeof DetailsTaskPayloadSchema>;
export type ProcessingTaskPayload = z.infer<typeof ProcessingTaskPayloadSchema>;
