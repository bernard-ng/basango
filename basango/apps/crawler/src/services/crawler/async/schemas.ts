import { z } from "zod";

import {
	AnySourceConfig,
	DateRangeSchema,
	PageRangeSchema,
} from "../../../schema";

export const ListingTaskPayloadSchema = z.object({
	source_id: z.string(),
	env: z.string().default("development"),
	page_range: z.string().optional().nullable(),
	date_range: z.string().optional().nullable(),
	category: z.string().optional().nullable(),
});

export type ListingTaskPayload = z.infer<typeof ListingTaskPayloadSchema>;

export const ArticleTaskPayloadSchema = z.object({
	source_id: z.string(),
	env: z.string().default("development"),
	url: z.string().url(),
	page: z.number().int().nonnegative().optional(),
	page_range: PageRangeSchema.optional().nullable(),
	date_range: DateRangeSchema.optional().nullable(),
	category: z.string().optional().nullable(),
});

export type ArticleTaskPayload = z.infer<typeof ArticleTaskPayloadSchema>;

export const ProcessedTaskPayloadSchema = z.object({
	source_id: z.string(),
	env: z.string().default("development"),
	article: z.any(),
});

export type ProcessedTaskPayload = z.infer<typeof ProcessedTaskPayloadSchema>;

export interface ListingContext {
	source: AnySourceConfig;
}
