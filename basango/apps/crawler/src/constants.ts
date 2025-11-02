import path from "node:path";

export const DEFAULT_DATE_FORMAT = "yyyy-LL-dd";
export const DEFAULT_CONFIG_FILES = [
  path.join(process.cwd(), "config", "pipeline.json"),
  path.join(process.cwd(), "pipeline.json"),
];

export const DEFAULT_USER_AGENT =
  "Basango/0.1 (+https://github.com/bernard-ng/basango)";
export const OPEN_GRAPH_USER_AGENT = "facebookexternalhit/1.1";

export const TRANSIENT_HTTP_STATUSES = [429, 500, 502, 503, 504] as const;

export const DEFAULT_RETRY_AFTER_HEADER = "retry-after";
