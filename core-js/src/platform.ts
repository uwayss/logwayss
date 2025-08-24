// Platform-agnostic interfaces for core functionality

export interface FileSystem {
  readFile(path: string, encoding: 'utf8'): Promise<string>;
  readFile(path: string): Promise<Buffer>;
  writeFile(path: string, data: string | Buffer, encoding?: 'utf8'): Promise<void>;
  stat(path: string): Promise<{ 
    isFile(): boolean; 
    isDirectory(): boolean; 
    size: number; 
    mtime: Date 
  }>;
  mkdir(path: string): Promise<void>;
  existsSync(path: string): boolean;
}

export interface CryptoEngine {
  randomBytes(size: number): Buffer;
  deriveKey(
    password: string | Buffer,
    salt: Buffer,
    params: { N: number; r: number; p: number; keyLen?: number }
  ): Promise<Buffer>;
  encrypt(
    aad: Buffer,
    key: Buffer,
    plaintext: Buffer
  ): { iv: Buffer; tag: Buffer; ciphertext: Buffer };
  decrypt(
    aad: Buffer,
    key: Buffer,
    iv: Buffer,
    tag: Buffer,
    ciphertext: Buffer
  ): Buffer;
}

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

export interface Platform {
  fs: FileSystem;
  crypto: CryptoEngine;
  dbFactory: DatabaseFactory;
}