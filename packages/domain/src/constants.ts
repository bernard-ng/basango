export const BIAS = ["neutral", "slightly", "partisan", "extreme"] as const;
export const RELIABILITY = ["trusted", "reliable", "average", "low_trust", "unreliable"] as const;
export const TRANSPARENCY = ["high", "medium", "low"] as const;
export const SENTIMENT = ["positive", "neutral", "negative"] as const;

export const UPDATE_DIRECTIONS = ["forward", "backward"] as const;
export const SOURCE_KINDS = ["wordpress", "html"] as const;

export const DEFAULT_DATE_FORMAT = "yyyy-LL-dd";
export const DEFAULT_DATETIME_FORMAT = "yyyy-LL-ddTHH:mmZ";
export const DEFAULT_USER_AGENT = "Basango/0.1 (+https://github.com/bernard-ng/basango)";
export const DEFAULT_OPEN_GRAPH_USER_AGENT = "facebookexternalhit/1.1";
export const DEFAULT_TRANSIENT_HTTP_STATUSES = [429, 500, 502, 503, 504];
export const DEFAULT_RETRY_AFTER_HEADER = "retry-after";

export const DEFAULT_PAGINATION_LIMIT = 12;
export const DEFAULT_PAGINATION_PAGE = 1;
export const DEFAULT_PAGINATION_MAX_LIMIT = 100;

export const DEFAULT_SOURCE_IMAGE = "https://devscast.org/images/sources/";
export const DEFAULT_PUBLICATION_GRAPH_DAYS = 30;
export const DEFAULT_CATEGORY_SHARES_LIMIT = 10;
export const DEFAULT_TIMEZONE = "Africa/Lubumbashi";

export const DEFAULT_ACCESS_TOKEN_COOKIE = "basango.access_token";
export const DEFAULT_REFRESH_TOKEN_COOKIE = "basango.refresh_token";
export const DEFAULT_ENCRYPTION_ALGORITHM = "aes-256-gcm";
export const DEFAULT_IV_LENGTH = 16;
export const DEFAULT_AUTH_TAG_LENGTH = 16;
export const DEFAULT_BCRYPT_SALT_ROUNDS = 12;
export const DEFAULT_TOKEN_AUDIENCE = "basango_dashboard";
export const DEFAULT_TOKEN_ISSUER = "basango_api";
export const DEFAULT_ACCESS_TOKEN_TTL = "35m";
export const DEFAULT_REFRESH_TOKEN_TTL = "7d";
