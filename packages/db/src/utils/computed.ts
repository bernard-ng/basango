import { TiktokenEncoding, get_encoding } from "tiktoken";

import { TokenStatistics } from "@/schema";

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
  categories: string[];
}): TokenStatistics => {
  const title = computeTokenCount(data.title);
  const body = computeTokenCount(data.body);
  const categories = computeTokenCount(data.categories.join(","));
  const excerpt = computeTokenCount(data.body.substring(0, 200));

  return {
    body,
    categories,
    excerpt,
    title,
    total: title + body + categories + excerpt,
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
