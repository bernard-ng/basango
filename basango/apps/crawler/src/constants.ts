import path from "node:path";

export const DEFAULT_DATE_FORMAT = "yyyy-LL-dd";
export const DEFAULT_CONFIG_FILES = [
  path.join(process.cwd(), "config", "pipeline.json"),
  path.join(process.cwd(), "pipeline.json"),
];
