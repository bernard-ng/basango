import type { SearchDocument, SearchIndexer } from "@basango/search/indexer";

import type { Database } from "#db/client";
import {
  clearArticleSearchEntries,
  countArticleSearchDocuments,
  failArticleSearchEntries,
  getArticleSearchDocumentBatch,
  getArticleSearchDocumentIds,
  getArticleSearchDocuments,
  getArticleSearchSynchronizationWatermark,
  getPendingArticleSearchEntries,
} from "#db/queries/search-documents";

type SearchSynchronizerOptions = {
  batchMaxBytes: number;
  batchSize: number;
  indexName: string;
};

export type SearchVerification = {
  databaseDocumentCount: number;
  indexDocumentCount: number;
  isSynchronized: boolean;
};

export class SearchSynchronizer {
  private configuration: Promise<void> | undefined;

  constructor(
    private readonly db: Database,
    private readonly indexer: SearchIndexer,
    private readonly options: SearchSynchronizerOptions,
  ) {}

  async synchronizeArticle(articleId: string): Promise<void> {
    await this.synchronizeArticles([articleId]);
  }

  async synchronizeArticles(articleIds: readonly string[]): Promise<void> {
    const uniqueIds = [...new Set(articleIds)];

    if (uniqueIds.length === 0) {
      return;
    }

    const synchronizationWatermark = await getArticleSearchSynchronizationWatermark(this.db);

    try {
      await this.synchronizeArticlesUnchecked(uniqueIds, synchronizationWatermark);
    } catch (error) {
      await failArticleSearchEntries(this.db, uniqueIds, error, synchronizationWatermark);
      throw error;
    }
  }

  async synchronizeSource(sourceId: string): Promise<number> {
    return this.synchronizeMatching({ sourceId });
  }

  async synchronizeCategory(categoryId: string): Promise<number> {
    return this.synchronizeMatching({ categoryId });
  }

  async synchronizeDirty(): Promise<number> {
    const entries = await getPendingArticleSearchEntries(this.db, this.options.batchSize);

    if (entries.length === 0) {
      return 0;
    }

    const upsertIds = entries
      .filter((entry) => entry.operation === "upsert")
      .map((entry) => entry.articleId);
    const deleteIds = entries
      .filter((entry) => entry.operation === "delete")
      .map((entry) => entry.articleId);
    const synchronizationWatermark = await getArticleSearchSynchronizationWatermark(this.db);

    try {
      await this.ensureConfigured();
      await this.synchronizeArticlesUnchecked(upsertIds, synchronizationWatermark);
      await this.indexer.deleteDocuments(deleteIds);
      await clearArticleSearchEntries(this.db, deleteIds, synchronizationWatermark);
    } catch (error) {
      await failArticleSearchEntries(
        this.db,
        entries.map((entry) => entry.articleId),
        error,
        synchronizationWatermark,
      );
      throw error;
    }

    return entries.length;
  }

  async drainDirty(): Promise<number> {
    let total = 0;

    while (true) {
      const synchronized = await this.synchronizeDirty();
      total += synchronized;

      if (synchronized === 0) {
        return total;
      }
    }
  }

  async rebuild(): Promise<SearchVerification> {
    const temporaryIndex = `${this.options.indexName}_rebuild_${Date.now()}`;
    await this.indexer.createIndex(temporaryIndex);

    try {
      await this.indexer.configure(temporaryIndex);
      let afterId: string | undefined;

      while (true) {
        const documents = await getArticleSearchDocumentBatch(this.db, {
          afterId,
          limit: this.options.batchSize,
        });

        if (documents.length === 0) {
          break;
        }

        await this.upsertBatches(documents, temporaryIndex);
        afterId = documents.at(-1)?.id;
      }

      const databaseDocumentCount = await countArticleSearchDocuments(this.db);
      const replacement = await this.indexer.verify(temporaryIndex);

      if (replacement.documentCount !== databaseDocumentCount) {
        throw new Error(
          `Search rebuild verification failed: PostgreSQL has ${databaseDocumentCount} articles but ${temporaryIndex} has ${replacement.documentCount}`,
        );
      }

      await this.ensureConfigured();
      await this.indexer.swapIndexes(this.options.indexName, temporaryIndex);
      await this.indexer.deleteIndex(temporaryIndex);
      await this.drainDirty();

      return this.verify();
    } catch (error) {
      await this.indexer.deleteIndex(temporaryIndex).catch(() => undefined);
      throw error;
    }
  }

  async verify(): Promise<SearchVerification> {
    const [databaseDocumentCount, index] = await Promise.all([
      countArticleSearchDocuments(this.db),
      this.indexer.verify(),
    ]);

    return {
      databaseDocumentCount,
      indexDocumentCount: index.documentCount,
      isSynchronized: databaseDocumentCount === index.documentCount,
    };
  }

  private async ensureConfigured(): Promise<void> {
    if (!this.configuration) {
      this.configuration = this.indexer.configure().catch((error) => {
        this.configuration = undefined;
        throw error;
      });
    }

    await this.configuration;
  }

  private async synchronizeMatching(filters: {
    categoryId?: string;
    sourceId?: string;
  }): Promise<number> {
    let afterId: string | undefined;
    let total = 0;

    while (true) {
      const ids = await getArticleSearchDocumentIds(this.db, {
        ...filters,
        afterId,
        limit: this.options.batchSize,
      });

      if (ids.length === 0) {
        return total;
      }

      await this.synchronizeArticles(ids);
      total += ids.length;
      afterId = ids.at(-1);
    }
  }

  private async synchronizeArticlesUnchecked(
    articleIds: readonly string[],
    watermark?: Date,
  ): Promise<void> {
    if (articleIds.length === 0) {
      return;
    }

    await this.ensureConfigured();
    const synchronizationWatermark =
      watermark ?? (await getArticleSearchSynchronizationWatermark(this.db));
    const documents = await getArticleSearchDocuments(this.db, articleIds);
    const foundIds = new Set(documents.map((document) => document.id));
    const deletedIds = articleIds.filter((id) => !foundIds.has(id));

    await this.upsertBatches(documents);
    await this.indexer.deleteDocuments(deletedIds);
    await clearArticleSearchEntries(this.db, articleIds, synchronizationWatermark);
  }

  private async upsertBatches(
    documents: readonly SearchDocument[],
    indexName?: string,
  ): Promise<void> {
    for (const batch of byteBoundedBatches(
      documents,
      this.options.batchSize,
      this.options.batchMaxBytes,
    )) {
      await this.indexer.upsertDocuments(batch, indexName);
    }
  }
}

export function byteBoundedBatches(
  documents: readonly SearchDocument[],
  maxDocuments: number,
  maxBytes: number,
): SearchDocument[][] {
  const batches: SearchDocument[][] = [];
  let batch: SearchDocument[] = [];
  let batchBytes = 2;

  for (const document of documents) {
    const documentBytes =
      Buffer.byteLength(JSON.stringify(document), "utf8") + (batch.length > 0 ? 1 : 0);

    if (
      batch.length > 0 &&
      (batch.length >= maxDocuments || batchBytes + documentBytes > maxBytes)
    ) {
      batches.push(batch);
      batch = [];
      batchBytes = 2;
    }

    if (documentBytes + 2 > maxBytes) {
      throw new Error(`Article ${document.id} exceeds the ${maxBytes}-byte search batch limit`);
    }

    batch.push(document);
    batchBytes += documentBytes;
  }

  if (batch.length > 0) {
    batches.push(batch);
  }

  return batches;
}
