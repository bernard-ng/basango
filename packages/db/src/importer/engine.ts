import { RowDataPacket } from "mysql2/promise";
import { Pool, PoolClient } from "pg";

import { computeReadingTime, computeTokenStatistics } from "@/utils/computed";

type SourceOptions = {
  host: string;
  user: string;
  password: string;
  database: string;
};

type TargetOptions = {
  database: string;
  batchSize?: number;
  pageSize?: number;
  ignoreColumns?: Record<string, string[]>;
};

const DEFAULT_IGNORE: Record<string, string[]> = {
  article: ["tsv", "image", "excerpt", "bias", "reliability", "transparency"],
  source: ["bias", "reliability", "transparency"],
};

/**
 * Engine
 *
 * Coordinates copying rows from a MySQL source into a PostgreSQL target in a
 * controlled, transactional, batched manner.
 *
 * Responsibilities:
 * - Establish and manage a connection pool to the target PostgreSQL database.
 * - Stream rows from a MySQL source (via a temporary pool) using pagination.
 * - Transform row values to match target expectations (UUID normalization,
 *   timestamp fallback, array parsing for categories/roles, computed JSON
 *   credibility, etc.).
 * - Filter out ignored columns based on a configurable ignore map.
 * - Insert rows into the target in configurable batch sizes with transactional
 *   commits every batch to limit long-running transactions.
 * - Provide a safe reset operation that truncates the target table and manages
 *   session replication role toggling for Postgres.
 *
 * @param sourceOptions - connection and authentication options for the MySQL
 *   source (database, host, user, password, etc.).
 * @param targetOptions - configuration for the Postgres target including
 *   connection string (database), optional pageSize, batchSize and per-table
 *   ignoreColumns map.
 */
export class Engine {
  private readonly target: Pool;
  private readonly ignore: Record<string, string[]>;
  private readonly pageSize: number;
  private readonly batchSize: number;

  constructor(
    private readonly sourceOptions: SourceOptions,
    private readonly targetOptions: TargetOptions,
  ) {
    this.target = new Pool({
      allowExitOnIdle: true,
      connectionString: this.targetOptions.database,
      max: 8,
    });
    this.ignore = { ...DEFAULT_IGNORE, ...(this.targetOptions.ignoreColumns ?? {}) };
    this.pageSize = this.targetOptions.pageSize ?? 10_000;
    this.batchSize = Math.max(1, this.targetOptions.batchSize ?? 1000);
    console.log(
      `Engine initialized with pageSize=${this.pageSize} and batchSize=${this.batchSize}`,
    );
  }

  async close() {
    await this.target.end();
  }

  async import(table: string): Promise<number> {
    await this.reset(table);
    return await this.paste(table, this.copy(table));
  }

  private async *copy(table: string): AsyncGenerator<Record<string, unknown>> {
    const mysql = await import("mysql2/promise");

    const source = mysql.createPool({
      database: this.sourceOptions.database,
      host: this.sourceOptions.host,
      idleTimeout: 180_000_000,
      password: this.sourceOptions.password,
      port: 3306,
      rowsAsArray: false,
      user: this.sourceOptions.user,
    });

    let offset = 0;
    const size = this.pageSize;
    try {
      while (true) {
        const [rows] = await source.query<RowDataPacket[]>(
          `SELECT * FROM \`${this.escapeBacktick(table)}\` LIMIT ? OFFSET ?`,
          [size, offset],
        );

        if (!rows || rows.length === 0) break;

        for (const row of rows) {
          yield row as Record<string, unknown>;
        }

        offset += rows.length;
        if (rows.length < size) break;
      }
    } finally {
      try {
        await source.end();
      } catch {}
    }
  }

  private async paste(
    table: string,
    rows: AsyncGenerator<Record<string, unknown>>,
  ): Promise<number> {
    const target = await this.target.connect();
    let total = 0;
    let inBatch = 0;
    let columns: string[] | null = null;
    let insertSql = "";

    const ignored = this.ignoredColumnsFor(table);
    const ignoredSet = new Set(ignored);

    try {
      for await (let row of rows) {
        if (!columns) {
          row = this.transformRowForTarget(table, row);
          // Filter ignored columns and build column order
          columns = Object.keys(row).filter((c) => !ignoredSet.has(c));

          // If article target has credibility but source not, include computed credibility
          if (
            (this.normalizedName(table) === "article" && !columns.includes("credibility")) ||
            (this.normalizedName(table) === "source" && !columns.includes("credibility"))
          ) {
            columns.push("credibility");
          }

          if (this.normalizedName(table) === "article" && !columns.includes("token_statistics")) {
            columns.push("token_statistics");
          }

          const colsSql = columns.map((c) => this.quote(c)).join(", ");
          const placeholders = columns.map((_, i) => `$${i + 1}`).join(", ");
          insertSql = `INSERT INTO ${this.quote(table)} (${colsSql}) VALUES (${placeholders})`;

          await target.query("BEGIN");
        }

        // Row transform and params in column order
        const transformed = this.transformRowForTarget(table, row);
        const params = columns!.map((c) => this.valueForColumn(c, transformed));

        try {
          await target.query(insertSql, params);
        } catch (err: unknown) {
          const msg = String((err as Error)?.message ?? "");
          if (msg.includes("invalid input syntax for type timestamp")) {
            // Fallback: coerce all *_at params to now() and retry once
            const fixed = columns!.map((c, i) => (c.endsWith("_at") ? new Date() : params[i]));
            await target.query(insertSql, fixed);
          } else {
            throw err;
          }
        }
        total++;
        inBatch++;

        if (inBatch >= this.batchSize) {
          await target.query("COMMIT");
          inBatch = 0;
          await target.query("BEGIN");
          console.log(`Imported ${total} records into ${table} so far...`);
        }
      }

      if (inBatch > 0) {
        await target.query("COMMIT");
      }
    } catch (e) {
      await safeRollback(target);
      throw e;
    } finally {
      target.release();
    }

    return total;
  }

  private normalizedName(table: string): string {
    return table.replaceAll('"', "").replaceAll("`", "").toLowerCase();
  }

  private ignoredColumnsFor(table: string): string[] {
    return this.ignore[this.normalizedName(table)] ?? [];
  }

  private async reset(table: string) {
    const client = await this.target.connect();
    try {
      await client.query("BEGIN");
      await client.query("SET session_replication_role = 'replica'");
      await client.query(`TRUNCATE TABLE ${this.quote(table)} RESTART IDENTITY CASCADE`);
      await client.query("SET session_replication_role = 'origin'");
      await client.query("COMMIT");
      console.log(`Reset completed for table ${table}`);
    } catch (e) {
      await safeRollback(client);
      throw e;
    } finally {
      client.release();
    }
  }

  private transformRowForTarget(table: string, row: Record<string, unknown>) {
    const t = this.normalizedName(table);
    const clone: Record<string, unknown> = { ...row };

    // Normalize UUIDs and timestamps and categories
    for (const [key, val] of Object.entries(clone)) {
      if (val == null) continue;

      if (key === "id" || key.endsWith("_id")) {
        clone[key] = this.normalizeUuidValue(val);
        continue;
      }

      // Robust timestamp normalization for *_at columns
      if (key.endsWith("_at")) {
        clone[key] = this.normalizeTimestampValue(val);
        continue;
      }

      if (key === "categories") {
        if (Array.isArray(val)) {
          clone[key] = val;
        } else if (typeof val === "string") {
          const raw = val.trim();
          // Try JSON first
          if (raw.startsWith("[") && raw.endsWith("]")) {
            try {
              const parsed = JSON.parse(raw);
              if (Array.isArray(parsed)) {
                clone[key] = parsed;
                continue;
              }
            } catch {}
          }

          const parts = raw
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean);
          clone[key] = parts.length ? parts : null;
        }
      }

      if (t === "article" && key === "token_statistics") {
        clone[key] = computeTokenStatistics({
          body: String(clone.body ?? ""),
          categories: Array.isArray(clone.categories) ? clone.categories : [],
          title: String(clone.title ?? ""),
        });
      }

      if (t === "article" && key === "reading_time") {
        clone[key] = Math.max(1, computeReadingTime(String(clone.body ?? "")));
      }

      if (key === "roles") {
        if (Array.isArray(val)) {
          clone[key] = val;
        } else if (typeof val === "string") {
          const raw = val.trim();

          // If the value is a JSON array string like '["ROLE_USER","ROLE_ADMIN"]', parse it.
          try {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed)) {
              clone[key] = parsed;
              continue;
            }
          } catch {
            // not JSON, fall back to CSV-like parsing below
          }

          // Remove surrounding brackets/quotes then split by comma and strip quotes/space
          const parts = raw
            .replace(/^\[|\]$/g, "")
            .split(",")
            .map((s) => s.replace(/^["']|["']$/g, "").trim())
            .filter(Boolean);

          clone[key] = parts.length ? parts : ["ROLE_USER"];
        }
      }
    }

    // compute credibility JSON if bias/reliability/transparency present
    if (t === "article" || t === "source") {
      const bias = clone.bias ?? null;
      const reliability = clone.reliability ?? null;
      const transparency = clone.transparency ?? null;
      if (bias || reliability || transparency) {
        clone.credibility = {
          bias,
          reliability,
          transparency,
        };
      }
    }

    // Ensure article token_statistics exists (computed on the fly)
    if (
      t === "article" &&
      (clone.token_statistics == null || typeof clone.token_statistics !== "object")
    ) {
      clone.token_statistics = computeTokenStatistics({
        body: String(clone.body ?? ""),
        categories: Array.isArray(clone.categories) ? (clone.categories as string[]) : [],
        title: String(clone.title ?? ""),
      });
    }

    return clone;
  }

  private valueForColumn(col: string, row: Record<string, unknown>) {
    const v = row[col];
    // Pass Date objects directly to pg for timestamp columns
    if (col.endsWith("_at") && v instanceof Date) {
      return v;
    }
    if (col === "credibility" && v && typeof v === "object") {
      return JSON.stringify(v);
    }
    if (col === "token_statistics" && v && typeof v === "object") {
      return JSON.stringify(v);
    }
    if (col === "device" && v && typeof v === "object") {
      return JSON.stringify(v);
    }
    if (col === "location" && v && typeof v === "object") {
      return JSON.stringify(v);
    }
    if (col === "roles" && v) {
      return JSON.stringify(v);
    }
    if (col === "metadata" && v && typeof v === "object") {
      return JSON.stringify(v);
    }
    return v ?? null;
  }

  private normalizeUuidValue(value: unknown): string {
    if (Buffer.isBuffer(value)) {
      return bufferToUuid(value);
    }
    if (typeof value === "string") {
      // Already a UUID string or hex; try to format 32-hex into canonical form
      const hex = value.replace(/-/g, "").toLowerCase();
      if (/^[0-9a-f]{32}$/.test(hex)) {
        return (
          hex.slice(0, 8) +
          "-" +
          hex.slice(8, 12) +
          "-" +
          hex.slice(12, 16) +
          "-" +
          hex.slice(16, 20) +
          "-" +
          hex.slice(20)
        );
      }
      return value;
    }
    return String(value);
  }

  private normalizeTimestampValue(value: unknown): Date {
    // If it's already a Date, ensure it's valid
    if (value instanceof Date) {
      return Number.isNaN(value.getTime()) ? new Date() : value;
    }

    // Strings: handle common invalid patterns and attempt safe parsing
    if (typeof value === "string") {
      const raw = value.trim();
      if (
        !raw ||
        /0000-00-00/.test(raw) ||
        /NaN/.test(raw) ||
        raw.toLowerCase() === "invalid date"
      ) {
        return new Date();
      }

      // Normalize MySQL-like 'YYYY-MM-DD HH:MM:SS[.ffffff]' to ISO
      let s = raw.replace(" ", "T");
      // Reduce microseconds to milliseconds (3 digits) if present
      s = s.replace(/\.(\d{3})\d+$/, ".$1");
      // Append Z if there is no timezone info
      if (!/[zZ]|[+-]\d{2}:?\d{2}$/.test(s)) s += "Z";

      const d = new Date(s);
      if (!Number.isNaN(d.getTime())) return d;

      // Try numeric string as epoch seconds/millis
      const n = Number(raw);
      if (Number.isFinite(n)) {
        const ms = n > 1e12 ? n : n * 1000;
        const d2 = new Date(ms);
        if (!Number.isNaN(d2.getTime())) return d2;
      }

      return new Date();
    }

    // Numbers: treat as epoch seconds/millis
    if (typeof value === "number" && Number.isFinite(value)) {
      const ms = value > 1e12 ? value : value * 1000;
      const d = new Date(ms);
      return Number.isNaN(d.getTime()) ? new Date() : d;
    }

    // Fallback: now
    return new Date();
  }

  private quote(id: string) {
    const norm = this.normalizedName(id);
    return `"${norm.replaceAll('"', '""')}"`;
  }

  private escapeBacktick(id: string) {
    return id.replaceAll("`", "``");
  }
}

function bufferToUuid(buf: Buffer): string {
  if (buf.length !== 16) return buf.toString("hex");
  const hex = buf.toString("hex");
  return (
    hex.slice(0, 8) +
    "-" +
    hex.slice(8, 12) +
    "-" +
    hex.slice(12, 16) +
    "-" +
    hex.slice(16, 20) +
    "-" +
    hex.slice(20)
  );
}

async function safeRollback(client: PoolClient) {
  try {
    await client.query("ROLLBACK");
  } catch {}
}
