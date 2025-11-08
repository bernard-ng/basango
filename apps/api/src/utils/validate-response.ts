import { logger } from "@basango/logger";
import { z } from "zod";

export function validateResponse(data: unknown, schema: z.ZodSchema) {
  const result = schema.safeParse(data);

  if (!result.success) {
    const cause = z.treeifyError(result.error);

    logger.error(cause);

    return {
      data: null,
      details: cause,
      error: "Response validation failed",
      success: false,
    };
  }

  return result.data;
}
