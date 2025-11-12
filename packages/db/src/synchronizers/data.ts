#!/usr/bin/env bun

import { RowDataPacket } from "mysql2/promise";
import { Pool, PoolClient } from "pg";

import { env } from "@/config";
import { computeReadingTime } from "@/utils/computed";

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
  resume?: boolean;
};

const DEFAULT_IGNORE: Record<string, string[]> = {
  article: ["tsv", "image", "excerpt", "bias", "reliability", "transparency"],
  source: ["bias", "reliability", "transparency"],
};

class Engine {
  private readonly target: Pool;
  private readonly ignore: Record<string, string[]>;
  private readonly pageSize: number;
  private readonly batchSize: number;
  private readonly resume: boolean;

  constructor(
    private readonly sourceOptions: SourceOptions,
    private readonly targetOptions: TargetOptions,
  ) {
    this.target = new Pool({
      allowExitOnIdle: true,
      connectionString: this.targetOptions.database,
      max: 16,
    });
    this.ignore = { ...DEFAULT_IGNORE, ...(this.targetOptions.ignoreColumns ?? {}) };
    this.pageSize = this.targetOptions.pageSize ?? 1000;
    this.batchSize = Math.max(1, this.targetOptions.batchSize ?? 50);
    this.resume = !!this.targetOptions.resume;
    console.log(
      `Engine initialized with pageSize=${this.pageSize} and batchSize=${this.batchSize} (resume=${this.resume})`,
    );
  }

  async close() {
    await this.target.end();
  }

  async import(table: string): Promise<number> {
    await this.ensureProgressTable();

    let startOffset = 0;
    if (this.resume) {
      startOffset = await this.getProgressOffset(table);
      console.log(`Resuming import for ${table} from offset=${startOffset}`);
    } else {
      await this.reset(table);
      await this.setProgressOffset(table, 0);
    }

    return await this.paste(table, this.copy(table, startOffset), startOffset);
  }

  private async *copy(table: string, startOffset = 0): AsyncGenerator<Record<string, unknown>> {
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

    let offset = startOffset;
    const size = this.pageSize;
    try {
      while (true) {
        const [rows] = await source.query<RowDataPacket[]>(
          `SELECT * FROM \`${this.escapeBacktick(table)}\` ORDER BY \`id\` LIMIT ? OFFSET ?`,
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
    startOffset = 0,
  ): Promise<number> {
    const target = await this.target.connect();
    let total = 0;
    let inBatch = 0;
    let columns: string[] | null = null;
    let insertSql = "";
    let upsertSql = "";

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

          const updateCols = columns.filter((c) => c !== "id");
          const setSql = updateCols
            .map((c) => `${this.quote(c)} = EXCLUDED.${this.quote(c)}`)
            .join(", ");
          upsertSql = `${insertSql} ON CONFLICT ("id") DO UPDATE SET ${setSql}`;

          await target.query("BEGIN");
        }

        // Row transform and params in column order
        const transformed = this.transformRowForTarget(table, row);
        const params = columns!.map((c) => this.valueForColumn(c, transformed));

        try {
          await target.query(upsertSql, params);
        } catch (err: unknown) {
          // Fallback: coerce all *_at params to now() and retry once
          // This will never happen in production but anyway let's keep it safe
          const msg = String((err as Error)?.message ?? "");
          if (msg.includes("invalid input syntax for type timestamp")) {
            const fixed = columns!.map((c, i) => (c.endsWith("_at") ? new Date() : params[i]));
            await target.query(upsertSql, fixed);
          } else {
            throw err;
          }
        }
        total++;
        inBatch++;

        if (inBatch >= this.batchSize) {
          await this.setProgressOffset(table, startOffset + total, target);
          await target.query("COMMIT");
          inBatch = 0;
          await target.query("BEGIN");
          console.log(`Imported ${total} records into ${table} so far...`);
        }
      }

      if (inBatch > 0) {
        await this.setProgressOffset(table, startOffset + total, target);
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

    for (const [key, val] of Object.entries(clone)) {
      if (val == null) continue;

      if (key === "id" || key.endsWith("_id")) {
        clone[key] = this.normalizeUuidValue(val);
        continue;
      }

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

      if (t === "article" && key === "reading_time") {
        clone[key] = Math.max(1, computeReadingTime(String(clone.body ?? "")));
      }

      if (key === "roles") {
        if (Array.isArray(val)) {
          clone[key] = val;
        } else if (typeof val === "string") {
          const parts = val
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean);

          clone[key] = parts.length ? parts : ["ROLE_USER"];
        }
      }
    }

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
      return v;
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

  private async ensureProgressTable() {
    const client = await this.target.connect();
    try {
      await client.query(
        `CREATE TABLE IF NOT EXISTS "__sync_state" (
          table_name text PRIMARY KEY,
          last_offset integer NOT NULL DEFAULT 0,
          updated_at timestamp NOT NULL DEFAULT NOW()
        )`,
      );
    } finally {
      client.release();
    }
  }

  private async getProgressOffset(table: string): Promise<number> {
    const client = await this.target.connect();
    try {
      const { rows } = await client.query<{ last_offset: number }>(
        `SELECT last_offset FROM "__sync_state" WHERE table_name = $1`,
        [this.normalizedName(table)],
      );
      return rows[0]?.last_offset ?? 0;
    } finally {
      client.release();
    }
  }

  private async setProgressOffset(
    table: string,
    offset: number,
    client?: PoolClient,
  ): Promise<void> {
    const run = async (c: PoolClient) => {
      await c.query(
        `INSERT INTO "__sync_state" (table_name, last_offset, updated_at)
         VALUES ($1, $2, NOW())
         ON CONFLICT (table_name) DO UPDATE SET last_offset = EXCLUDED.last_offset, updated_at = NOW()`,
        [this.normalizedName(table), offset],
      );
    };
    if (client) return run(client);
    const c = await this.target.connect();
    try {
      await run(c);
    } finally {
      c.release();
    }
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

async function main() {
  const argv = process.argv.slice(2);
  const resume = argv.includes("--resume") || argv.includes("-r");
  const tables = argv.filter((a) => !a.startsWith("-"));

  const engine = new Engine(
    {
      database: env("BASANGO_SOURCE_DATABASE_NAME"),
      host: env("BASANGO_SOURCE_DATABASE_HOST"),
      password: env("BASANGO_SOURCE_DATABASE_PASS"),
      user: env("BASANGO_SOURCE_DATABASE_USER"),
    },
    {
      database: env("BASANGO_DATABASE_URL"),
      resume,
    },
  );

  try {
    if (tables.length === 0) tables.push("user", "source", "article");
    for (const t of tables) {
      const count = await engine.import(t);
      console.log(`Imported ${count} records into ${t} table.`);
    }
    console.log("Import completed successfully");
    process.exit(0);
  } finally {
    await engine.close();
  }
}

main().catch((err) => {
  console.error(err?.message ?? err);
  process.exit(1);
});
