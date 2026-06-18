import {
  type AnySourceOptions,
  type HtmlSourceOptions,
  type WordPressSourceOptions,
  config,
} from "@basango/domain/config";

export const resolveSourceConfig = (id: string): AnySourceOptions => {
  const source =
    config.crawler.sources.html.find((s: HtmlSourceOptions) => s.sourceId === id) ||
    config.crawler.sources.wordpress.find((s: WordPressSourceOptions) => s.sourceId === id);

  if (source === undefined) {
    throw new Error(`Source '${id}' not found in configuration`);
  }

  return source;
};
