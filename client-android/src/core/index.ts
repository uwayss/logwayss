import { Entry, NewEntry, QueryFilter, Pagination, ValidationError, validateNewEntry } from '@logwayss/core';
import * as FileSystem from 'expo-file-system';
import * as SQLite from 'expo-sqlite';

export class Core {
  private _isUnlocked: boolean = false;
  private _dataDir?: string;
  private _db: SQLite.SQLiteDatabase | null = null;

  // Create a new profile
  async createProfile(dataDir: string, password: string, params?: any): Promise<void> {
    // Use the documents directory if no dataDir is provided
    const actualDataDir = dataDir || FileSystem.documentDirectory + 'logwayss';
    
    // Create the data directory if it doesn't exist
    const dirInfo = await FileSystem.getInfoAsync(actualDataDir);
    if (!dirInfo.exists) {
      await FileSystem.makeDirectoryAsync(actualDataDir, { intermediates: true });
    }

    // Create a simple profile file
    const profilePath = `${actualDataDir}/profile.json`;
    const profile = {
      createdAt: new Date().toISOString(),
      schemaVersion: 1
    };
    
    await FileSystem.writeAsStringAsync(profilePath, JSON.stringify(profile));
    
    this._dataDir = actualDataDir;
    this._isUnlocked = true;
  }

  // Unlock an existing profile
  async unlockProfile(dataDir: string, password: string): Promise<void> {
    // Use the documents directory if no dataDir is provided
    const actualDataDir = dataDir || FileSystem.documentDirectory + 'logwayss';
    
    // Check if the profile exists
    const profilePath = `${actualDataDir}/profile.json`;
    const fileInfo = await FileSystem.getInfoAsync(profilePath);
    
    if (!fileInfo.exists) {
      throw new Error('Profile not found');
    }
    
    this._dataDir = actualDataDir;
    this._isUnlocked = true;
    
    // Open the database
    if (this._dataDir) {
      this._db = await SQLite.openDatabaseAsync(`${this._dataDir}/db.sqlite3`);
      
      // Create tables if they don't exist
      await this._db.execAsync(`
        CREATE TABLE IF NOT EXISTS entries (
          id TEXT PRIMARY KEY,
          type TEXT NOT NULL,
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL,
          schema_version INTEGER NOT NULL,
          source TEXT,
          device_id TEXT,
          meta_json TEXT,
          payload TEXT NOT NULL
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
    }
  }

  // Lock the profile
  async lock(): Promise<void> {
    this._isUnlocked = false;
    this._dataDir = undefined;
    if (this._db) {
      await this._db.closeAsync();
      this._db = null;
    }
  }

  // Check if the profile is unlocked
  isUnlocked(): boolean {
    return this._isUnlocked;
  }

  // Create a new entry
  async createEntry(newEntry: NewEntry): Promise<Entry> {
    if (!this._isUnlocked || !this._dataDir || !this._db) {
      throw new Error('Profile is locked');
    }

    // Validate the new entry
    validateNewEntry(newEntry);

    // Generate a simple ID (in a real implementation, we'd use ULID)
    const id = Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
    
    const now = new Date().toISOString();
    const entry: Entry = {
      ...newEntry,
      id,
      schema_version: 1,
      created_at: now,
      updated_at: now,
    };

    // Insert the entry into the database
    const metaJson = entry.meta ? JSON.stringify(entry.meta) : null;
    const payloadJson = entry.payload ? JSON.stringify(entry.payload) : null;
    
    await this._db.runAsync(
      `INSERT INTO entries (id, type, created_at, updated_at, schema_version, source, device_id, meta_json, payload)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      entry.id,
      entry.type,
      entry.created_at,
      entry.updated_at,
      entry.schema_version,
      entry.source || null,
      entry.device_id || null,
      metaJson,
      payloadJson
    );
    
    // Insert tags if they exist
    if (entry.tags && entry.tags.length > 0) {
      for (const tag of entry.tags) {
        await this._db.runAsync(
          'INSERT OR IGNORE INTO entry_tags (entry_id, tag) VALUES (?, ?)',
          entry.id,
          tag
        );
      }
    }
    
    return entry;
  }

  // Get an entry by ID
  async getEntry(id: string): Promise<Entry> {
    if (!this._isUnlocked || !this._db) {
      throw new Error('Profile is locked');
    }

    // Retrieve the entry from the database
    const row = await this._db.getFirstAsync<any>(
      'SELECT * FROM entries WHERE id = ?',
      id
    );
    
    if (!row) {
      throw new Error('Entry not found');
    }

    // Retrieve tags
    const tagRows = await this._db.getAllAsync<any>(
      'SELECT tag FROM entry_tags WHERE entry_id = ?',
      id
    );
    
    const tags = tagRows.map((row: any) => row.tag);

    // Parse meta and payload
    const meta = row.meta_json ? JSON.parse(row.meta_json) : undefined;
    const payload = row.payload ? JSON.parse(row.payload) : undefined;

    const entry: Entry = {
      id: row.id,
      type: row.type,
      schema_version: row.schema_version,
      created_at: row.created_at,
      updated_at: row.updated_at,
      source: row.source || undefined,
      device_id: row.device_id || undefined,
      meta,
      tags: tags.length > 0 ? tags : undefined,
      payload
    };
    
    return entry;
  }

  // Query entries
  async query(filter: QueryFilter, pagination?: Pagination): Promise<Entry[]> {
    if (!this._isUnlocked || !this._db) {
      throw new Error('Profile is locked');
    }

    let sql = 'SELECT * FROM entries';
    const params: any[] = [];
    
    // Apply filters
    const whereClauses: string[] = [];
    
    if (filter.type) {
      whereClauses.push('type = ?');
      params.push(filter.type);
    }
    
    if (filter.time?.from) {
      whereClauses.push('created_at >= ?');
      params.push(filter.time.from);
    }
    
    if (filter.time?.to) {
      whereClauses.push('created_at <= ?');
      params.push(filter.time.to);
    }
    
    if (whereClauses.length > 0) {
      sql += ' WHERE ' + whereClauses.join(' AND ');
    }
    
    sql += ' ORDER BY created_at DESC';
    
    // Apply pagination
    if (pagination?.limit) {
      sql += ' LIMIT ?';
      params.push(pagination.limit);
      
      if (pagination.offset) {
        sql += ' OFFSET ?';
        params.push(pagination.offset);
      }
    }

    // Retrieve entries
    const rows = await this._db.getAllAsync<any>(sql, ...params);
    
    const entries: Entry[] = [];
    
    for (const row of rows) {
      // Retrieve tags
      const tagRows = await this._db.getAllAsync<any>(
        'SELECT tag FROM entry_tags WHERE entry_id = ?',
        row.id
      );
      
      const tags = tagRows.map((r: any) => r.tag);

      // Parse meta and payload
      const meta = row.meta_json ? JSON.parse(row.meta_json) : undefined;
      const payload = row.payload ? JSON.parse(row.payload) : undefined;

      const entry: Entry = {
        id: row.id,
        type: row.type,
        schema_version: row.schema_version,
        created_at: row.created_at,
        updated_at: row.updated_at,
        source: row.source || undefined,
        device_id: row.device_id || undefined,
        meta,
        tags: tags.length > 0 ? tags : undefined,
        payload
      };
      
      entries.push(entry);
    }
    
    return entries;
  }

  // Export archive
  async exportArchive(dest: string): Promise<void> {
    if (!this._isUnlocked || !this._dataDir) {
      throw new Error('Profile is locked');
    }

    // Copy the database file
    const dbPath = `${this._dataDir}/db.sqlite3`;
    await FileSystem.copyAsync({
      from: dbPath,
      to: dest
    });
  }

  // Import archive
  async importArchive(src: string): Promise<void> {
    if (!this._isUnlocked || !this._dataDir) {
      throw new Error('Profile is locked');
    }

    // Close the current database
    if (this._db) {
      await this._db.closeAsync();
      this._db = null;
    }

    // Copy the source database file
    const dbPath = `${this._dataDir}/db.sqlite3`;
    await FileSystem.copyAsync({
      from: src,
      to: dbPath
    });

    // Reopen the database
    this._db = await SQLite.openDatabaseAsync(dbPath);
  }
}

export { Entry, NewEntry, QueryFilter, Pagination, ValidationError };