import { Delta, TokenStatistics } from "@basango/domain/models";
import { TiktokenEncoding, get_encoding } from "tiktoken";

/**
 * Count the number of tokens in the given text using the specified encoding.
 * @param text - The input text
 * @param encoding - The token encoding (default: "cl100k_base")
 */
export const computeTokenCount = (
  text: string,
  encoding: TiktokenEncoding = "cl100k_base",
): number => {
  try {
    const encoder = get_encoding(encoding);
    const tokens = encoder.encode(text);
    encoder.free();
    return tokens.length;
  } catch {
    return text.length;
  }
};

/**
 * Create token statistics for the given data.
 * @param data  - The input data containing title, body, and categories
 * @returns TokenStatistics object
 */
export const computeTokenStatistics = (data: {
  title: string;
  body: string;
  categories?: string[];
}): TokenStatistics => {
  const normalizedCategories = data.categories ?? [];
  const titleTokens = computeTokenCount(data.title);
  const bodyTokens = computeTokenCount(data.body);
  const categoryTokens = computeTokenCount(normalizedCategories.join(","));
  const excerptTokens = computeTokenCount(data.body.substring(0, 200));

  return {
    body: bodyTokens,
    categories: categoryTokens,
    excerpt: excerptTokens,
    title: titleTokens,
    total: titleTokens + bodyTokens + categoryTokens + excerptTokens,
  };
};

/**
 * Compute the estimated reading time for the given text.
 * @param text - The input text
 * @param wordsPerMinute - The reading speed in words per minute (default: 200)
 * @returns The estimated reading time in minutes
 */
export const computeReadingTime = (text: string, wordsPerMinute = 200): number => {
  const words = text.trim().split(/\s+/).length;
  return Math.ceil(words / wordsPerMinute);
};

export const computeDelta = (current: number, previous: number): Delta => {
  const delta = current - previous;
  const percentage = previous === 0 ? (current === 0 ? 0 : 100) : (delta / previous) * 100;
  const sign = delta >= 0 ? "+" : "-";
  const variant = previous === 0 ? "positive" : delta >= 0 ? "increase" : "decrease";

  return {
    delta,
    percentage,
    sign,
    variant,
  };
};
