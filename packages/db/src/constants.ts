/**
 * Base URL for source images.
 * This URL is used to construct the full path to source images stored on the server.
 */
export const SOURCE_IMAGE_BASE = "https://devscast.org/images/sources/";

/**
 * Number of days to include in the publication graph for sources.
 * This defines the time range for which publication data is aggregated and displayed.
 */
export const PUBLICATION_GRAPH_DAYS = 30;

/**
 * Maximum number of category shares to return for a source.
 * This limits the number of categories displayed in the category share breakdown.
 */
export const CATEGORY_SHARES_LIMIT = 10;

/**
 * The default timezone
 */
export const TIMEZONE = "Africa/Lubumbashi";

/**
 * Default pagination settings.
 * These constants define the default page number, default limit per page,
 * and maximum limit allowed for paginated requests.
 */
export const PAGINATION_DEFAULT_PAGE = 1;
export const PAGINATION_DEFAULT_LIMIT = 5;
export const PAGINATION_MAX_LIMIT = 100;
