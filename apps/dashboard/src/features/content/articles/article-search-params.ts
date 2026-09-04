import { z } from "zod";

const optionalIdSchema = z.uuid().optional().catch(undefined);
const optionalDateSchema = z.iso.date().optional().catch(undefined);

export const articleSearchParamsSchema = z.object({
  after: optionalDateSchema,
  before: optionalDateSchema,
  category: optionalIdSchema,
  q: z.string().trim().max(512).optional().catch(undefined),
  scope: z.enum(["all", "title"]).optional().catch(undefined),
  sentiment: z.enum(["negative", "neutral", "positive"]).optional().catch(undefined),
  sort: z.enum(["relevance", "newest"]).optional().catch(undefined),
  source: optionalIdSchema,
});

export type ArticleSearchParams = z.infer<typeof articleSearchParamsSchema>;

export function resolveArticleSearchDates(search: ArticleSearchParams): {
  publishedAfter?: Date;
  publishedBefore?: Date;
} {
  return {
    publishedAfter: search.after ? new Date(`${search.after}T00:00:00.000Z`) : undefined,
    publishedBefore: search.before ? new Date(`${search.before}T23:59:59.999Z`) : undefined,
  };
}
