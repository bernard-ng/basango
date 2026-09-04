import { z } from "zod";

const optionalIdSchema = z.uuid().optional().catch(undefined);

export const articleSearchParamsSchema = z.object({
  category: optionalIdSchema,
  q: z.string().trim().max(512).optional().catch(undefined),
  sentiment: z.enum(["negative", "neutral", "positive"]).optional().catch(undefined),
  source: optionalIdSchema,
});

export type ArticleSearchParams = z.infer<typeof articleSearchParamsSchema>;
