import path from "node:path";

import { config } from "@basango/domain/config";

export const resolveCrawlerDataPath = (): string => {
  const dataPath = config.crawler.paths.data?.trim();
  if (dataPath) {
    return path.resolve(dataPath);
  }

  const rootPath = config.crawler.paths.root?.trim();
  return path.resolve(rootPath || process.cwd(), "data");
};

export const resolveCrawlerSqlitePath = (): string => {
  const sqlitePath =
    process.env.BASANGO_CRAWLER_SQLITE_PATH?.trim() || config.crawler.paths.sqlite?.trim();
  if (sqlitePath) {
    return path.resolve(sqlitePath);
  }

  return path.join(resolveCrawlerDataPath(), "crawler.db");
};
