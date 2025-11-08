/**
 * Error thrown when an article is invalid or cannot be processed.
 */
export class InvalidArticleError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InvalidArticleError";
  }
}

/**
 * Error thrown when a source kind is not supported by the crawler.
 */
export class UnsupportedSourceKindError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "UnsupportedSourceKindError";
  }
}

/**
 * Error thrown when a source's selectors are invalid or missing.
 */
export class InvalidSourceSelectorsError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InvalidSourceSelectorsError";
  }
}

/**
 * Error thrown when an article's publication date is outside the specified date range.
 */
export class ArticleOutOfDateRangeError extends Error {
  constructor(message: string, _meta: Record<string, unknown>) {
    super(message);
    this.name = "ArticleOutOfDateRangeError";
  }
}
