import { z } from "@hono/zod-openapi";

import { BIAS, RELIABILITY, SENTIMENT, TRANSPARENCY } from "#domain/constants";

// schemas
export const idSchema = z.uuid().openapi({
  description: "The unique identifier of the resource.",
  example: "b3e1c8f4-5d6a-4c9e-8f1e-2d3c4b5a6f7g",
});

export const dateRangeSchema = z
  .object({
    end: z.date().openapi({
      description: "The end date of the range.",
      example: "2023-01-30T23:59:59Z",
    }),
    start: z.date().openapi({
      description: "The start date of the range.",
      example: "2023-01-01T00:00:00Z",
    }),
  })
  .openapi({
    description: "Inclusive date range for publication metrics.",
  });

export const limitSchema = z.number().int().min(1).max(100).openapi({
  default: 10,
  description: "The maximum number of items to return.",
  example: 10,
});

export const sentimentSchema = z.enum(SENTIMENT).openapi({
  description: "Sentiment detected for the article.",
  example: "positive",
});

export const biasSchema = z.enum(BIAS).openapi({
  description: "The bias level of the source.",
  example: "neutral",
});

export const reliabilitySchema = z.enum(RELIABILITY).openapi({
  description: "The reliability level of the source.",
  example: "trusted",
});

export const transparencySchema = z.enum(TRANSPARENCY).openapi({
  description: "The transparency level of the source.",
  example: "high",
});

export const credibilitySchema = z
  .object({
    bias: biasSchema.default("neutral"),
    reliability: reliabilitySchema.default("average"),
    transparency: transparencySchema.default("medium"),
  })
  .openapi({
    description: "Credibility information about the resource.",
  });

export const deviceSchema = z
  .object({
    client: z.string().optional().openapi({
      description: "The client software of the device.",
      example: "Chrome 90",
    }),
    device: z.string().optional().openapi({
      description: "The device model.",
      example: "Dell XPS 13",
    }),
    isBot: z.boolean().openapi({
      description: "Indicates if the device is a bot.",
      example: false,
    }),
    operatingSystem: z.string().optional().openapi({
      description: "The operating system of the device.",
      example: "Windows 10",
    }),
  })
  .openapi({
    description: "Information about the user's device.",
  });

export const geoLocationSchema = z
  .object({
    accuracyRadius: z.number().optional().openapi({
      description: "The accuracy radius in kilometers.",
      example: 50,
    }),
    city: z.string().optional().openapi({
      description: "The city of the user.",
      example: "San Francisco",
    }),
    country: z.string().optional().openapi({
      description: "The country of the user.",
      example: "United States",
    }),
    latitude: z.number().optional().openapi({
      description: "The latitude of the user's location.",
      example: 37.7749,
    }),
    longitude: z.number().optional().openapi({
      description: "The longitude of the user's location.",
      example: -122.4194,
    }),
    timeZone: z.string().optional().openapi({
      description: "The time zone of the user.",
      example: "America/Los_Angeles",
    }),
  })
  .openapi({
    description: "Geolocation information about the user.",
  });

export const distrubtionSchema = z
  .object({
    count: z.number().int().openapi({
      description: "The count of items in the distribution.",
      example: 42,
    }),
    id: idSchema,
    name: z.string().openapi({
      description: "The name of the distribution.",
      example: "Technology",
    }),
    percentage: z.number().openapi({
      description: "The percentage of items in the distribution.",
      example: 12.5,
    }),
  })
  .openapi({
    description: "Distribution information.",
  });

export const getDistributionsSchema = z.object({
  id: idSchema.optional(),
  limit: limitSchema.optional(),
});

export const getPublicationsSchema = z.object({
  id: idSchema.optional(),
  range: dateRangeSchema.optional(),
});

export const distributionsSchema = z
  .object({
    items: z.array(distrubtionSchema).openapi({
      description: "List of distributions.",
    }),
    total: z.number().int().openapi({
      description: "Total number of distributions.",
      example: 100,
    }),
  })
  .openapi({
    description: "Distributions data.",
  });

export const publicationSchema = z
  .object({
    count: z.number().int().openapi({
      description: "The number of articles published on that date.",
      example: 42,
    }),
    date: z.string().openapi({
      description: "The date of the publication.",
      example: "2023-01-15",
    }),
  })
  .openapi({
    description: "Publication metrics for a specific date.",
  });

export const deltaSchema = z
  .object({
    delta: z.number().openapi({
      description: "The absolute change in value.",
      example: 10,
    }),
    percentage: z.number().openapi({
      description: "The percentage change in value.",
      example: 25.0,
    }),
    sign: z.enum(["+", "-"]).openapi({
      description: "The sign of the change.",
      example: "+",
    }),
    variant: z.enum(["increase", "decrease", "positive"]).openapi({
      description: "The variant of the change.",
      example: "increase",
    }),
  })
  .openapi({
    description: "Delta information representing change over time.",
  });

export const publicationMetaSchema = z
  .object({
    current: z.number().openapi({
      description: "The current total value.",
      example: 150,
    }),
    delta: deltaSchema,
    previous: z.number().openapi({
      description: "The previous total value.",
      example: 120,
    }),
  })
  .openapi({
    description: "Metadata for publication metrics.",
  });

export const publicationsSchema = z
  .object({
    items: z.array(publicationSchema).openapi({
      description: "List of publication metrics for the source.",
    }),
    meta: publicationMetaSchema.optional(),
  })
  .openapi({
    description: "Publication metrics for the source.",
  });

export const paginationCursorSchema = z
  .object({
    date: z.string().openapi({
      description: "The date associated with the last item in the current page.",
      example: "2023-01-15",
    }),
    id: z.string().openapi({
      description: "The unique identifier of the last item in the current page.",
      example: "b3e1c8f4-5d6a-4c9e-8f1e-2d3c4b5a6f7g",
    }),
  })
  .openapi({
    description: "Cursor information for pagination.",
  });

export const paginationRequestSchema = z
  .object({
    cursor: z.string().nullable().optional().openapi({
      description: "The pagination cursor for cursor-based pagination.",
      example:
        "eyJkYXRlIjoiMjAyMy0wMS0xNSIsImlkIjoiYjNlMWM4ZjQtNWQ2YS00YzllLThmMWUtMmQzYzRiNWE2ZjdifQ==",
    }),
    limit: limitSchema.optional(),
    page: z.number().int().min(1).optional().openapi({
      description: "The page number to retrieve.",
      example: 1,
    }),
  })
  .openapi({
    description: "Pagination request parameters.",
  });

export const paginationStateSchema = z
  .object({
    cursor: z.string().nullable().openapi({
      description: "The current pagination cursor.",
      example:
        "eyJkYXRlIjoiMjAyMy0wMS0xNSIsImlkIjoiYjNlMWM4ZjQtNWQ2YS00YzllLThmMWUtMmQzYzRiNWE2ZjdifQ==",
    }),
    limit: z.number().int().openapi({
      description: "The number of items per page.",
      example: 10,
    }),
    offset: z.number().int().openapi({
      description: "The offset for the current page.",
      example: 0,
    }),
    page: z.number().int().openapi({
      description: "The current page number.",
      example: 1,
    }),
    payload: paginationCursorSchema.nullable().openapi({
      description: "The decoded payload from the pagination cursor.",
    }),
  })
  .openapi({
    description: "Internal pagination state.",
  });

export const paginationMetaSchema = z
  .object({
    current: z.number().int().openapi({
      description: "The current page number or offset.",
      example: 1,
    }),
    cursor: z.string().nullable().openapi({
      description: "The current pagination cursor.",
      example:
        "eyJkYXRlIjoiMjAyMy0wMS0xNSIsImlkIjoiYjNlMWM4ZjQtNWQ2YS00YzllLThmMWUtMmQzYzRiNWE2ZjdifQ==",
    }),
    hasNext: z.boolean().openapi({
      description: "Indicates if there is a next page available.",
      example: true,
    }),
    limit: z.number().int().openapi({
      description: "The number of items per page.",
      example: 10,
    }),
    nextCursor: z.string().nullable().openapi({
      description: "The next pagination cursor, if available.",
      example:
        "eyJkYXRlIjoiMjAyMy0wMS0yMCIsImlkIjoiZDRmNWU2ZTAtNzY4Ny00Y2E3LTg5ZTItYjY0ZGI3Y2E3ZGIifQ==",
    }),
  })
  .openapi({
    description: "Pagination metadata.",
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
