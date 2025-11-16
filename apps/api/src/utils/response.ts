import { logger } from "@basango/logger";
import { z } from "zod";

type ValidationSuccess<T> = z.infer<T>;

export function validateResponse<T extends z.ZodTypeAny>(
  data: unknown,
  schema: T,
): ValidationSuccess<T> {
  const result = schema.safeParse(data);

  if (!result.success) {
    const cause = z.treeifyError(result.error);
    logger.error({ cause }, "Response validation failed");

    throw new Error("Response validation failed");
  }

  return result.data;
}
