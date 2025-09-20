import Database from "better-sqlite3";

export interface DatabaseInterface {
  exec(sql: string): Promise<void>;
  run(sql: string, ...params: any[]): Promise<void>;
  get(sql: string, ...params: any[]): Promise<any>;
  all(sql: string, ...params: any[]): Promise<any[]>;
  close(): Promise<void>;
}

export class SQLiteDatabase implements DatabaseInterface {
  private db: Database.Database;

  constructor(path: string) {
    this.db = new Database(path);
  }

  async exec(sql: string): Promise<void> {
    this.db.exec(sql);
  }

  async run(sql: string, ...params: any[]): Promise<void> {
    this.db.prepare(sql).run(...params);
  }

  async get(sql: string, ...params: any[]): Promise<any> {
    return this.db.prepare(sql).get(...params);
  }

  async all(sql: string, ...params: any[]): Promise<any[]> {
    return this.db.prepare(sql).all(...params);
  }

  async close(): Promise<void> {
    this.db.close();
  }
}

export interface DatabaseFactory {
  open(path: string): Promise<DatabaseInterface>;
}

export class SQLiteDatabaseFactory implements DatabaseFactory {
  async open(path: string): Promise<DatabaseInterface> {
    return new SQLiteDatabase(path);
  }
}