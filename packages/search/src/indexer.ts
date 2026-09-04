import type { IndexVerification, SearchDocument } from "./contracts";

export type { IndexVerification, SearchDocument } from "./contracts";
export { indexVerificationSchema, searchDocumentSchema } from "./contracts";

export type SearchIndexer = {
  configure(indexName?: string): Promise<void>;
  createIndex(indexName: string): Promise<void>;
  deleteDocuments(ids: readonly string[], indexName?: string): Promise<void>;
  deleteIndex(indexName: string): Promise<void>;
  swapIndexes(firstIndexName: string, secondIndexName: string): Promise<void>;
  upsertDocuments(documents: readonly SearchDocument[], indexName?: string): Promise<void>;
  verify(indexName?: string): Promise<IndexVerification>;
};
