export type CrawlRunEventType =
  | "crawler.heartbeat"
  | "crawl.preparing"
  | "crawl.started"
  | "crawl.source.started"
  | "crawl.article.persisted"
  | "crawl.article.forwarded"
  | "crawl.source.done"
  | "crawl.done"
  | "crawl.failed";

export interface CrawlRunEvent {
  articlesForwarded?: number;
  articlesPersisted?: number;
  durationMs?: number;
  error?: string;
  event: CrawlRunEventType;
  nodeId?: string;
  runId?: string;
  sourceId?: string;
  sources?: string[];
  timestamp?: Date;
}
