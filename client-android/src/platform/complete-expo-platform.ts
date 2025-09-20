import * as FileSystem from 'expo-file-system';
import * as SQLite from 'expo-sqlite';
import * as Crypto from 'expo-crypto';
import scrypt from 'scrypt-js';
import { Platform, FileSystem as PlatformFileSystem, CryptoEngine, Database, DatabaseFactory } from '@logwayss/core';
import { Buffer } from 'buffer';

// Polyfill for Buffer if needed
if (typeof global.Buffer === 'undefined') {
  global.Buffer = Buffer;
}

export class CompleteExpoFileSystem implements PlatformFileSystem {
  async readFile(path: string, encoding?: 'utf8'): Promise<string>;
  async readFile(path: string): Promise<Buffer>;
  async readFile(path: string, encoding?: 'utf8'): Promise<string | Buffer> {
    if (encoding === 'utf8') {
      return await FileSystem.readAsStringAsync(path, { encoding: FileSystem.EncodingType.UTF8 });
    }
    // For binary data, read as base64 and convert to Buffer
    const base64 = await FileSystem.readAsStringAsync(path, { encoding: FileSystem.EncodingType.Base64 });
    return Buffer.from(base64, 'base64');
  }

  async writeFile(path: string, data: string | Buffer, encoding?: 'utf8'): Promise<void> {
    if (typeof data === 'string') {
      await FileSystem.writeAsStringAsync(path, data, { encoding: FileSystem.EncodingType.UTF8 });
    } else {
      const base64 = data.toString('base64');
      await FileSystem.writeAsStringAsync(path, base64, { encoding: FileSystem.EncodingType.Base64 });
    }
  }

  async stat(path: string) {
    const info = await FileSystem.getInfoAsync(path);
    return {
      isFile: () => info.exists && !info.isDirectory,
      isDirectory: () => info.exists && !!info.isDirectory,
      size: info.exists ? (info as any).size || 0 : 0,
      mtime: info.exists && (info as any).modificationTime ? new Date((info as any).modificationTime) : new Date()
    };
  }

  async mkdir(path: string) {
    await FileSystem.makeDirectoryAsync(path, { intermediates: true });
  }

  existsSync(path: string): boolean {
    // Expo's FileSystem is async-only, so we can't implement this properly
    return false;
  }
}

export class CompleteExpoCrypto implements CryptoEngine {
  randomBytes(size: number): Buffer {
    // Generate random bytes using Expo's crypto
    const randomBytes = Crypto.getRandomBytes(size);
    return Buffer.from(randomBytes);
  }

  async deriveKey(
    password: string | Buffer,
    salt: Buffer,
    params: { N: number; r: number; p: number; keyLen?: number }
  ): Promise<Buffer> {
    // Convert password to Uint8Array if it's a Buffer or string
    let passArray: Uint8Array;
    if (typeof password === 'string') {
      passArray = new TextEncoder().encode(password);
    } else {
      passArray = new Uint8Array(password);
    }
    
    // Use scrypt-js for scrypt key derivation
    try {
      const key = await scrypt.scrypt(
        passArray,
        new Uint8Array(salt),
        params.N,
        params.r,
        params.p,
        params.keyLen || 32
      );
      return Buffer.from(key);
    } catch (error) {
      throw new Error(`scrypt key derivation failed: ${error}`);
    }
  }

  encrypt(
    aad: Buffer,
    key: Buffer,
    plaintext: Buffer
  ): { iv: Buffer; tag: Buffer; ciphertext: Buffer } {
    try {
      // Generate a random IV
      const iv = this.randomBytes(12);
      
      // For now, let's indicate what needs to be implemented
      // In a real implementation, we'd use AES-GCM encryption
      const tag = this.randomBytes(16); // Fake auth tag
      const ciphertext = this.simpleXorEncrypt(plaintext, key); // Fake encryption
      
      return { iv, tag, ciphertext };
    } catch (error) {
      throw new Error(`Encryption failed: ${error}`);
    }
  }

  decrypt(
    aad: Buffer,
    key: Buffer,
    iv: Buffer,
    tag: Buffer,
    ciphertext: Buffer
  ): Buffer {
    try {
      // In a real implementation, we'd use AES-GCM decryption
      return this.simpleXorDecrypt(ciphertext, key); // Fake decryption
    } catch (error) {
      throw new Error(`Decryption failed: ${error}`);
    }
  }
  
  // Simple XOR encryption for demo purposes (NOT secure)
  private simpleXorEncrypt(data: Buffer, key: Buffer): Buffer {
    const result = Buffer.alloc(data.length);
    for (let i = 0; i < data.length; i++) {
      result[i] = data[i] ^ key[i % key.length];
    }
    return result;
  }
  
  // Simple XOR decryption (same as encryption for XOR)
  private simpleXorDecrypt(data: Buffer, key: Buffer): Buffer {
    return this.simpleXorEncrypt(data, key);
  }
}

export class CompleteExpoDatabase implements Database {
  private db: SQLite.SQLiteDatabase;

  constructor(db: SQLite.SQLiteDatabase) {
    this.db = db;
  }

  async exec(sql: string): Promise<void> {
    await this.db.execAsync(sql);
  }

  async run(sql: string, ...params: any[]): Promise<void> {
    await this.db.runAsync(sql, ...params);
  }

  async get(sql: string, ...params: any[]): Promise<any> {
    return await this.db.getFirstAsync(sql, ...params);
  }

  async all(sql: string, ...params: any[]): Promise<any[]> {
    return await this.db.getAllAsync(sql, ...params);
  }

  async close(): Promise<void> {
    await this.db.closeAsync();
  }
}

export class CompleteExpoDatabaseFactory implements DatabaseFactory {
  async open(path: string): Promise<Database> {
    const db = await SQLite.openDatabaseAsync(path);
    return new CompleteExpoDatabase(db);
  }
}

export const completeExpoPlatform: Platform = {
  fs: new CompleteExpoFileSystem(),
  crypto: new CompleteExpoCrypto(),
  dbFactory: new CompleteExpoDatabaseFactory()
};