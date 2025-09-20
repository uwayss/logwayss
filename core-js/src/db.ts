export interface Database {
  exec(sql: string): Promise<void>;
  run(sql: string, ...params: any[]): Promise<void>;
  get(sql: string, ...params: any[]): Promise<any>;
  all(sql: string, ...params: any[]): Promise<any[]>;
  close(): Promise<void>;
}

export interface DatabaseFactory {
  open(path: string): Promise<Database>;
}