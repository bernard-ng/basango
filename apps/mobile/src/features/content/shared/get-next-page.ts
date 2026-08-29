import type { PaginationMeta } from "@basango/domain/models";

type PagePosition = Pick<PaginationMeta, "current" | "hasNext">;

export function getNextPage({ current, hasNext }: PagePosition) {
  return hasNext ? current + 1 : undefined;
}
