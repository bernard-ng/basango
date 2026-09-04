import {
  type EnqueuedTaskPromise,
  ErrorStatusCode,
  type Meilisearch,
  MeilisearchApiError,
  type Settings,
} from "meilisearch";

import {
  type IndexVerification,
  type SearchDocument,
  type SearchIndexer,
  indexVerificationSchema,
  searchDocumentSchema,
} from "../indexer";
import { ARTICLE_INDEX_SETTINGS, hasExpectedSettings } from "./settings";

export class MeilisearchIndexer implements SearchIndexer {
  constructor(
    private readonly client: Meilisearch,
    private readonly indexName: string,
    private readonly taskTimeoutMs: number,
  ) {}

  async configure(indexName?: string): Promise<void> {
    const resolvedIndexName = indexName ?? this.indexName;
    const index = this.client.index<SearchDocument>(resolvedIndexName);
    let currentSettings: Settings | undefined;

    try {
      currentSettings = await index.getSettings();
    } catch (error) {
      if (!isIndexNotFoundError(error)) {
        throw error;
      }

      await this.createIndex(resolvedIndexName);
    }

    if (currentSettings && hasExpectedSettings(currentSettings)) {
      return;
    }

    await this.waitForTask(index.updateSettings(ARTICLE_INDEX_SETTINGS));
  }

  async createIndex(indexName: string): Promise<void> {
    try {
      await this.client.getRawIndex(indexName);

      return;
    } catch (error) {
      if (!isIndexNotFoundError(error)) {
        throw error;
      }
    }

    await this.waitForTask(this.client.createIndex(indexName, { primaryKey: "id" }));
  }

  async deleteDocuments(ids: readonly string[], indexName?: string): Promise<void> {
    if (ids.length === 0) {
      return;
    }

    const index = this.client.index(indexName ?? this.indexName);

    await this.waitForTask(index.deleteDocuments([...ids]));
  }

  async deleteIndex(indexName: string): Promise<void> {
    try {
      await this.client.getRawIndex(indexName);
    } catch (error) {
      if (isIndexNotFoundError(error)) {
        return;
      }

      throw error;
    }

    await this.waitForTask(this.client.deleteIndex(indexName));
  }

  async swapIndexes(firstIndexName: string, secondIndexName: string): Promise<void> {
    await this.waitForTask(
      this.client.swapIndexes([{ indexes: [firstIndexName, secondIndexName], rename: false }]),
    );
  }

  async upsertDocuments(documents: readonly SearchDocument[], indexName?: string): Promise<void> {
    if (documents.length === 0) {
      return;
    }

    const index = this.client.index<SearchDocument>(indexName ?? this.indexName);
    const validatedDocuments = searchDocumentSchema.array().parse(documents);

    await this.waitForTask(index.addDocuments(validatedDocuments, { primaryKey: "id" }));
  }

  async verify(indexName?: string): Promise<IndexVerification> {
    const resolvedIndexName = indexName ?? this.indexName;
    const stats = await this.client.index(resolvedIndexName).getStats();

    return indexVerificationSchema.parse({
      documentCount: stats.numberOfDocuments,
      indexName: resolvedIndexName,
    });
  }

  private async waitForTask(taskPromise: EnqueuedTaskPromise): Promise<void> {
    const task = await taskPromise.waitTask({ timeout: this.taskTimeoutMs });

    if (task.status === "succeeded") {
      return;
    }

    const message = task.error?.message ?? "Unknown task error";

    throw new Error(`Meilisearch task ${task.uid} ${task.status}: ${message}`);
  }
}

function isIndexNotFoundError(error: unknown): boolean {
  return (
    error instanceof MeilisearchApiError && error.cause?.code === ErrorStatusCode.INDEX_NOT_FOUND
  );
}
