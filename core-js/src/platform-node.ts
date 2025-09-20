import * as fs from "node:fs";
import { SQLiteDatabaseFactory } from "./db-sqlite.js";
import * as cryptoImpl from "./crypto.js";
import type { Platform } from "./platform.js";

export const nodePlatform: Platform = {
  fs: {
    readFile: async function(path: string, encoding?: "utf8") {
      if (encoding === "utf8") {
        return await fs.promises.readFile(path, "utf8");
      }
      return await fs.promises.readFile(path);
    } as any,
    writeFile: async function(path: string, data: string | Buffer, encoding?: "utf8") {
      if (encoding === "utf8" || typeof data === "string") {
        await fs.promises.writeFile(path, data, "utf8");
        return Promise.resolve();
      }
      await fs.promises.writeFile(path, data);
      return Promise.resolve();
    },
    stat: async function(filePath: string) {
      const stats = await fs.promises.stat(filePath);
      return {
        isFile: () => stats.isFile(),
        isDirectory: () => stats.isDirectory(),
        size: stats.size,
        mtime: stats.mtime
      };
    },
    mkdir: async function(filePath: string) {
      await fs.promises.mkdir(filePath, { recursive: true });
      return Promise.resolve();
    },
    existsSync: function(filePath: string) {
      return fs.existsSync(filePath);
    }
  },
  crypto: {
    randomBytes: function(size: number) {
      return cryptoImpl.randomBytesFn(size);
    },
    deriveKey: async function(
      password: string | Buffer,
      salt: Buffer,
      params: { N: number; r: number; p: number; keyLen?: number }
    ) {
      return await cryptoImpl.deriveKey(password, salt, params);
    },
    encrypt: function(
      aad: Buffer,
      key: Buffer,
      plaintext: Buffer
    ) {
      return cryptoImpl.encrypt(aad, key, plaintext);
    },
    decrypt: function(
      aad: Buffer,
      key: Buffer,
      iv: Buffer,
      tag: Buffer,
      ciphertext: Buffer
    ) {
      return cryptoImpl.decrypt(aad, key, iv, tag, ciphertext);
    }
  },
  dbFactory: new SQLiteDatabaseFactory()
};