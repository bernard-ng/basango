import fs from "node:fs";
import path from "node:path";

export interface PersistedRecord {
  [key: string]: unknown;
}

export interface Persistor {
  persist(record: PersistedRecord): Promise<void> | void;
  close?: () => Promise<void> | void;
}

export interface JsonlPersistorOptions {
  directory: string;
  sourceId: string;
  suffix?: string;
  encoding?: BufferEncoding;
}

export class JsonlPersistor implements Persistor {
  private readonly filePath: string;
  private readonly encoding: BufferEncoding;
  private pending: Promise<void> = Promise.resolve();
  private closed = false;

  constructor(options: JsonlPersistorOptions) {
    const suffix = options.suffix ?? ".jsonl";
    this.encoding = options.encoding ?? "utf-8";

    fs.mkdirSync(options.directory, { recursive: true });
    this.filePath = path.join(options.directory, `${options.sourceId}${suffix}`);

    if (!fs.existsSync(this.filePath)) {
      fs.writeFileSync(this.filePath, "", { encoding: this.encoding });
    }
  }

  persist(record: PersistedRecord): Promise<void> {
    if (this.closed) {
      return Promise.reject(new Error("Persistor has been closed"));
    }

    const payload = `${JSON.stringify(record)}\n`;

    this.pending = this.pending.then(async () => {
      const file = Bun.file(this.filePath);
      await Bun.write(file, payload, { append: true });
    });

    return this.pending;
  }

  async close(): Promise<void> {
    this.closed = true;
    await this.pending;
  }
}

export type { JsonlPersistorOptions as JsonlOptions };
