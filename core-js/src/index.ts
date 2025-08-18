export * as crypto from "./crypto.js";
export * from "./types.js";

import type { Entry, QueryFilter, Pagination } from "./types.js";
import path from "node:path";
import fs from "node:fs/promises";
import { existsSync } from "node:fs";
import { randomBytes } from "node:crypto";
import * as lwcrypto from "./crypto.js";
import { createRequire } from "node:module";

export class Core {
  private _dataDir?: string;
  private _sessionKey?: Buffer;
  private _schemaVersion = 1;
  private _db: any | undefined;

  private async getDB(): Promise<any> {
    if (!this._dataDir) throw new Error("profile locked");
    if (this._db) return this._db;
    const require = createRequire(import.meta.url);
    let Database: any;
    try {
      Database = require("better-sqlite3");
    } catch {
      throw new Error(
        "better-sqlite3 not installed. Run: npm i better-sqlite3"
      );
    }
    const dbPath = path.join(this._dataDir, "db.sqlite3");
    const db = new Database(dbPath);
    db.pragma("journal_mode = WAL");
    db.pragma("foreign_keys = ON");
    db.exec(`
      CREATE TABLE IF NOT EXISTS entries (
        id TEXT PRIMARY KEY,
        type TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        schema_version INTEGER NOT NULL,
        source TEXT,
        device_id TEXT,
        meta_json TEXT,
        payload BLOB NOT NULL,
        iv BLOB NOT NULL,
        tag BLOB NOT NULL
      );
      CREATE TABLE IF NOT EXISTS entry_tags (
        entry_id TEXT NOT NULL,
        tag TEXT NOT NULL,
        PRIMARY KEY (entry_id, tag),
        FOREIGN KEY (entry_id) REFERENCES entries(id) ON DELETE CASCADE
      );
      CREATE INDEX IF NOT EXISTS idx_entries_type ON entries(type);
      CREATE INDEX IF NOT EXISTS idx_entries_created_at ON entries(created_at);
      CREATE INDEX IF NOT EXISTS idx_entry_tags_tag ON entry_tags(tag);
    `);
    this._db = db;
    return db;
  }

  async createEntry(_entry: Entry): Promise<Entry> {
    if (!this._sessionKey || !this._dataDir) throw new Error("profile locked");
    const db = await this.getDB();
    const entry = { ..._entry } as Entry;
    if (!entry.id) throw new Error("entry.id required");
    if (!entry.type) throw new Error("entry.type required");
    entry.schema_version = entry.schema_version ?? this._schemaVersion;
    const nowIso = new Date().toISOString();
    entry.created_at = entry.created_at ?? nowIso;
    entry.updated_at = entry.updated_at ?? nowIso;

    const aad = Buffer.from(
      `schema=${entry.schema_version}|id=${entry.id}|type=${entry.type}`
    );
    const payloadBuf = Buffer.from(
      JSON.stringify(entry.payload ?? null),
      "utf8"
    );
    const { iv, tag, ciphertext } = lwcrypto.encrypt(
      aad,
      this._sessionKey,
      payloadBuf
    );

    const tx = db.transaction((e: Entry) => {
      db.prepare(
        `INSERT INTO entries (id, type, created_at, updated_at, schema_version, source, device_id, meta_json, payload, iv, tag)
         VALUES (@id, @type, @created_at, @updated_at, @schema_version, @source, @device_id, @meta_json, @payload, @iv, @tag)`
      ).run({
        id: e.id,
        type: e.type,
        created_at: e.created_at,
        updated_at: e.updated_at,
        schema_version: e.schema_version,
        source: e.source ?? null,
        device_id: e.device_id ?? null,
        meta_json: e.meta ? JSON.stringify(e.meta) : null,
        payload: ciphertext,
        iv,
        tag,
      });
      const tags = e.tags ?? [];
      if (tags.length) {
        const stmt = db.prepare(
          "INSERT OR IGNORE INTO entry_tags (entry_id, tag) VALUES (?, ?)"
        );
        for (const t of tags) stmt.run(e.id, t);
      }
    });
    tx(entry);
    return entry;
  }
  async getEntry(_id: string): Promise<Entry> {
    if (!this._sessionKey || !this._dataDir) throw new Error("profile locked");
    const db = await this.getDB();
    const row = db.prepare("SELECT * FROM entries WHERE id = ?").get(_id);
    if (!row) throw new Error("not found");
    const tags = db
      .prepare("SELECT tag FROM entry_tags WHERE entry_id = ?")
      .all(_id)
      .map((r: any) => r.tag as string);

    const aad = Buffer.from(
      `schema=${row.schema_version}|id=${row.id}|type=${row.type}`
    );
    const payloadBuf = lwcrypto.decrypt(
      aad,
      this._sessionKey,
      row.iv as Buffer,
      row.tag as Buffer,
      row.payload as Buffer
    );
    let payload: unknown = null;
    try {
      payload = JSON.parse(payloadBuf.toString("utf8"));
    } catch {
      payload = null;
    }
    const meta = row.meta_json
      ? JSON.parse(row.meta_json as string)
      : undefined;
    const e: Entry = {
      id: row.id,
      type: row.type,
      created_at: row.created_at,
      updated_at: row.updated_at,
      schema_version: row.schema_version,
      source: row.source ?? undefined,
      device_id: row.device_id ?? undefined,
      meta,
      tags: tags.length ? tags : undefined,
      payload,
    };
    return e;
  }
  async query(
    _filter: QueryFilter,
    _pagination?: Pagination
  ): Promise<Entry[]> {
    if (!this._sessionKey || !this._dataDir) throw new Error("profile locked");
    const db = await this.getDB();
    const filter = _filter ?? {};
    const pagination = _pagination ?? {};

    const where: string[] = [];
    const params: any[] = [];
    if (filter.type) {
      where.push("e.type = ?");
      params.push(filter.type);
    }
    if (filter.time?.from) {
      where.push("e.created_at >= ?");
      params.push(filter.time.from);
    }
    if (filter.time?.to) {
      where.push("e.created_at <= ?");
      params.push(filter.time.to);
    }

    let sql = "SELECT e.* FROM entries e";
    if (filter.tags && filter.tags.length) {
      sql += " JOIN entry_tags t ON t.entry_id = e.id";
      where.push(`t.tag IN (${filter.tags.map(() => "?").join(",")})`);
      params.push(...filter.tags);
    }
    if (where.length) sql += " WHERE " + where.join(" AND ");
    if (filter.tags && filter.tags.length) {
      sql += " GROUP BY e.id HAVING COUNT(DISTINCT t.tag) = ?";
      params.push(filter.tags.length);
    }
    sql += " ORDER BY e.created_at DESC";
    if (pagination.limit) {
      sql += " LIMIT ?";
      params.push(pagination.limit);
      if (pagination.offset) {
        sql += " OFFSET ?";
        params.push(pagination.offset);
      }
    }

    const rows = db.prepare(sql).all(...params);
    const out: Entry[] = [];
    for (const row of rows) {
      const tags = db
        .prepare("SELECT tag FROM entry_tags WHERE entry_id = ?")
        .all(row.id)
        .map((r: any) => r.tag as string);
      const aad = Buffer.from(
        `schema=${row.schema_version}|id=${row.id}|type=${row.type}`
      );
      const payloadBuf = lwcrypto.decrypt(
        aad,
        this._sessionKey,
        row.iv as Buffer,
        row.tag as Buffer,
        row.payload as Buffer
      );
      let payload: unknown = null;
      try {
        payload = JSON.parse(payloadBuf.toString("utf8"));
      } catch {
        payload = null;
      }
      const meta = row.meta_json
        ? JSON.parse(row.meta_json as string)
        : undefined;
      out.push({
        id: row.id,
        type: row.type,
        created_at: row.created_at,
        updated_at: row.updated_at,
        schema_version: row.schema_version,
        source: row.source ?? undefined,
        device_id: row.device_id ?? undefined,
        meta,
        tags: tags.length ? tags : undefined,
        payload,
      });
    }
    return out;
  }
  async exportArchive(dest: string): Promise<void> {
    if (!this._sessionKey || !this._dataDir) throw new Error("profile locked");
    const db = await this.getDB();
    // Use the backup API to safely copy the database to the destination file.
    // This creates a consistent snapshot without interfering with live operations.
    await db.backup(dest);
  }

  async importArchive(src: string): Promise<void> {
    if (!this._sessionKey || !this._dataDir) throw new Error("profile locked");
    // This is a destructive operation. We first close the current DB connection
    // to release file locks and checkpoint the WAL file.
    if (this._db) {
      try {
        this._db.close();
      } catch {}
      this._db = undefined;
    }
    const dbPath = path.join(this._dataDir, "db.sqlite3");
    // Copy the source archive file to the database path, replacing it.
    await fs.copyFile(src, dbPath);
    // The next call to getDB() will transparently open the newly imported database.
  }

  private profilePath(dir: string): string {
    return path.join(dir, "profile.json");
  }

  /**
   * CreateProfile initializes a new encrypted profile file in the given data dir.
   * Header stores scrypt params and salt; payload is an encrypted JSON check blob.
   */
  async createProfile(
    dataDir: string,
    password: string | Buffer,
    params?: { N: number; r: number; p: number; keyLen?: number }
  ): Promise<void> {
    const defaults = { N: 1 << 15, r: 8, p: 1, keyLen: 32 };
    const scrypt = { ...defaults, ...(params ?? {}) };
    await fs.mkdir(dataDir, { recursive: true });
    const pPath = this.profilePath(dataDir);
    if (existsSync(pPath)) throw new Error("profile already exists");

    const salt = randomBytes(32);
    const key = await lwcrypto.deriveKey(password, salt, scrypt);
    const aad = Buffer.from(
      `schema=${this._schemaVersion}|type=profile`,
      "utf8"
    );
    const payload = Buffer.from(
      JSON.stringify({
        magic: "LOGWAYSS_PROFILE",
        schema_version: this._schemaVersion,
        created_at: new Date().toISOString(),
      }),
      "utf8"
    );
    const { iv, tag, ciphertext } = lwcrypto.encrypt(aad, key, payload);

    const out = {
      schema_version: this._schemaVersion,
      scrypt,
      salt: salt.toString("hex"),
      iv: iv.toString("hex"),
      tag: tag.toString("hex"),
      ciphertext: ciphertext.toString("hex"),
    } as const;
    await fs.writeFile(pPath, JSON.stringify(out, null, 2), {
      encoding: "utf8",
    });
  }

  /**
   * UnlockProfile opens and verifies the encrypted profile with the provided password.
   */
  async unlockProfile(
    dataDir: string,
    password: string | Buffer
  ): Promise<void> {
    const pPath = this.profilePath(dataDir);
    const txt = await fs.readFile(pPath, "utf8");
    const parsed = JSON.parse(txt) as {
      schema_version: number;
      scrypt: { N: number; r: number; p: number; keyLen?: number };
      salt: string;
      iv: string;
      tag: string;
      ciphertext: string;
    };
    const salt = Buffer.from(parsed.salt, "hex");
    const key = await lwcrypto.deriveKey(password, salt, parsed.scrypt);
    const aad = Buffer.from(
      `schema=${parsed.schema_version}|type=profile`,
      "utf8"
    );
    const plaintext = lwcrypto.decrypt(
      aad,
      key,
      Buffer.from(parsed.iv, "hex"),
      Buffer.from(parsed.tag, "hex"),
      Buffer.from(parsed.ciphertext, "hex")
    );
    const obj = JSON.parse(plaintext.toString("utf8")) as { magic: string };
    if (obj.magic !== "LOGWAYSS_PROFILE")
      throw new Error("invalid profile or password");

    this._sessionKey = key;
    this._dataDir = dataDir;
    this._schemaVersion = parsed.schema_version ?? this._schemaVersion;
  }

  /** Clear in-memory secret material and lock the session. */
  lock(): void {
    if (this._sessionKey) {
      // Best-effort zeroing
      this._sessionKey.fill(0);
    }
    if (this._db && typeof this._db.close === "function") {
      try {
        this._db.close();
      } catch {
        /* ignore */
      }
    }
    this._sessionKey = undefined;
    this._dataDir = undefined;
    this._db = undefined;
  }
  isUnlocked(): boolean {
    return !!this._sessionKey;
  }
}
