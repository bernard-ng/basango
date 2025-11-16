import { z } from "zod";

import { UPDATE_DIRECTIONS } from "#domain/constants";

// schemas
export const UpdateDirectionSchema = z.enum(UPDATE_DIRECTIONS);

export const TimestampRangeSchema = z
  .object({
    end: z.number().int(),
    start: z.number().int(),
  })
  .superRefine((value, ctx) => {
    if (value.start === 0 || value.end === 0) {
      ctx.addIssue({
        code: "custom",
        message: "Timestamp cannot be zero",
      });
    }
    if (value.end < value.start) {
      ctx.addIssue({
        code: "custom",
        message: "End timestamp must be greater than or equal to start",
      });
    }
  });

export const PageRangeSchema = z
  .object({
    end: z.number().int().min(0),
    start: z.number().int().min(0),
  })
  .superRefine((value, ctx) => {
    if (value.end < value.start) {
      ctx.addIssue({
        code: "custom",
        message: "End page must be greater than or equal to start page",
      });
    }
  });

export const PageSpecSchema = z
  .string()
  .regex(/^[0-9]+:[0-9]+$/, "Invalid page range format. Use start:end")
  .transform((spec) => {
    const [startText, endText] = spec.split(":");
    return {
      end: Number.parseInt(String(endText), 10),
      start: Number.parseInt(String(startText), 10),
    };
  });

export const DateSpecSchema = z
  .string()
  .regex(/.+:.+/, "Expected start:end format")
  .transform((spec) => {
    const [startRaw, endRaw] = spec.split(":");
    return { endRaw: String(endRaw), startRaw: String(startRaw) };
  });

// types
export type UpdateDirection = z.infer<typeof UpdateDirectionSchema>;
export type TimestampRange = z.infer<typeof TimestampRangeSchema>;
export type PageSpec = z.infer<typeof PageSpecSchema>;
export type DateSpec = z.infer<typeof DateSpecSchema>;
export type PageRange = z.infer<typeof PageRangeSchema>;
