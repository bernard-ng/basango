import { z } from "@hono/zod-openapi";

import { BIAS, RELIABILITY, SENTIMENT, TRANSPARENCY } from "../constants";

// schemas
export const idSchema = z.uuid();

export const dateRangeSchema = z.object({
  end: z.coerce.date(),
  start: z.coerce.date(),
});

export const limitSchema = z.number().int().min(1).max(100);
export const sentimentSchema = z.enum(SENTIMENT);
export const biasSchema = z.enum(BIAS);
export const reliabilitySchema = z.enum(RELIABILITY);
export const transparencySchema = z.enum(TRANSPARENCY);

export const credibilitySchema = z.object({
  bias: biasSchema.default("neutral"),
  reliability: reliabilitySchema.default("average"),
  transparency: transparencySchema.default("medium"),
});

export const deviceSchema = z.object({
  client: z.string().optional(),
  device: z.string().optional(),
  isBot: z.boolean(),
  operatingSystem: z.string().optional(),
});

export const geoLocationSchema = z.object({
  accuracyRadius: z.number().optional(),
  city: z.string().optional(),
  country: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  timeZone: z.string().optional(),
});

export const distrubtionSchema = z.object({
  count: z.number().int(),
  id: idSchema,
  name: z.string(),
  percentage: z.number(),
});

export const getDistributionsSchema = z.object({
  id: idSchema.optional(),
  limit: limitSchema.optional(),
});

export const getPublicationsSchema = z.object({
  id: idSchema.optional(),
  range: dateRangeSchema.optional(),
});

export const distributionsSchema = z.object({
  items: z.array(distrubtionSchema),
  total: z.number().int(),
});

export const publicationSchema = z.object({
  count: z.number().int(),
  date: z.string(),
});

export const deltaSchema = z.object({
  delta: z.number(),
  percentage: z.number(),
  sign: z.enum(["+", "-"]),
  variant: z.enum(["increase", "decrease", "positive"]),
});

export const publicationMetaSchema = z.object({
  current: z.number(),
  delta: deltaSchema,
  previous: z.number(),
});

export const publicationsSchema = z.object({
  items: z.array(publicationSchema),
  meta: publicationMetaSchema.optional(),
});

export const paginationCursorSchema = z.object({
  date: z.string(),
  id: z.string(),
});

export const paginationRequestSchema = z.object({
  cursor: z.string().nullable().optional(),
  limit: limitSchema.optional(),
  page: z.number().nonnegative().default(1).optional(),
});

export const paginationStateSchema = z.object({
  cursor: z.string().nullable(),
  limit: z.number().int(),
  offset: z.number().int(),
  page: z.number().int(),
  payload: paginationCursorSchema.nullable(),
});

export const paginationMetaSchema = z.object({
  current: z.number().int(),
  cursor: z.string().nullable(),
  hasNext: z.boolean(),
  limit: z.number().int(),
  nextCursor: z.string().nullable(),
});

// types
export type PaginatedResult<T> = {
  items: T[];
  meta: PaginationMeta;
};

export type ID = z.infer<typeof idSchema>;
export type DateRange = z.infer<typeof dateRangeSchema>;
export type Sentiment = z.infer<typeof sentimentSchema>;
export type Bias = z.infer<typeof biasSchema>;
export type Reliability = z.infer<typeof reliabilitySchema>;
export type Transparency = z.infer<typeof transparencySchema>;
export type Credibility = z.infer<typeof credibilitySchema>;
export type Device = z.infer<typeof deviceSchema>;
export type GeoLocation = z.infer<typeof geoLocationSchema>;

export type Distribution = z.infer<typeof distrubtionSchema>;
export type Distributions = z.infer<typeof distributionsSchema>;
export type Publication = z.infer<typeof publicationSchema>;
export type Publications = z.infer<typeof publicationsSchema>;
export type PublicationMeta = z.infer<typeof publicationMetaSchema>;
export type Delta = z.infer<typeof deltaSchema>;

export type PaginationCursor = z.infer<typeof paginationCursorSchema>;
export type PaginationRequest = z.infer<typeof paginationRequestSchema>;
export type PaginationState = z.infer<typeof paginationStateSchema>;
export type PaginationMeta = z.infer<typeof paginationMetaSchema>;
