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

export const paginationRequestSchema = z
  .object({
    limit: limitSchema.optional(),
    page: z.number().int().positive().default(1).optional(),
  })
  .strict();

export const paginationStateSchema = z.object({
  limit: z.number().int().positive(),
  offset: z.number().int().nonnegative(),
  page: z.number().int().positive(),
});

export const paginationMetaSchema = z.object({
  current: z.number().int().positive(),
  hasNext: z.boolean(),
  hasPrevious: z.boolean(),
  limit: z.number().int().positive(),
  offset: z.number().int().nonnegative(),
  pages: z.number().int().positive(),
  total: z.number().int().nonnegative(),
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

export type PaginationRequest = z.infer<typeof paginationRequestSchema>;
export type PaginationState = z.infer<typeof paginationStateSchema>;
export type PaginationMeta = z.infer<typeof paginationMetaSchema>;
