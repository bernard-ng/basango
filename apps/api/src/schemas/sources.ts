import { z } from "zod";

const idSchema = z.uuid().openapi({
  description: "The unique identifier of the source.",
  example: "b3e1c8f4-5d6a-4c9e-8f1e-2d3c4b5a6f7g",
});

const biasSchema = z.enum(["neutral", "slightly", "partisan", "extreme"]).openapi({
  description: "The bias level of the source.",
  example: "neutral",
});
const reliabilitySchema = z
  .enum(["trusted", "reliable", "average", "low_trust", "unreliable"])
  .openapi({
    description: "The reliability level of the source.",
    example: "trusted",
  });

const transparencySchema = z.enum(["high", "medium", "low"]).openapi({
  description: "The transparency level of the source.",
  example: "high",
});

const credibilitySchema = z
  .object({
    bias: biasSchema.default("neutral"),
    reliability: reliabilitySchema.default("average"),
    transparency: transparencySchema.default("medium"),
  })
  .openapi({
    description: "Credibility information about the source.",
  });

export const createSourceSchema = z.object({
  credibility: credibilitySchema.optional(),
  description: z.string().max(1024).optional().openapi({
    description: "A brief description of the source.",
    example: "Radio Okapi is a Congolese radio station that provides news and information.",
  }),
  displayName: z.string().min(1).max(255).optional().openapi({
    description: "The display name of the source.",
    example: "Radio Okapi",
  }),
  name: z.string().min(1).max(255).openapi({
    description: "The name of the source.",
    example: "radiookapi.com",
  }),
  url: z.url().openapi({
    description: "The URL of the source.",
    example: "https://techcrunch.com",
  }),
});

export const getSourceSchema = z.object({
  id: idSchema,
});

export const updateSourceSchema = z.object({
  credibility: credibilitySchema.optional(),
  description: createSourceSchema.shape.description,
  displayName: createSourceSchema.shape.displayName,
  id: idSchema,
  name: createSourceSchema.shape.name.optional(),
});

export const createSourceResponseSchema = z.object({
  id: idSchema,
  ...createSourceSchema.shape,
});
