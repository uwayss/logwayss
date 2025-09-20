// Expo-compatible platform implementation
// This is a simplified version for demonstration purposes

import type { Platform } from "./platform.js";

// Mock implementations for Expo
export const expoPlatform: Platform = {
  fs: {
    readFile: async function(path: string, encoding?: "utf8") {
      // In a real implementation, this would use expo-file-system
      throw new Error("File system not implemented for Expo");
    } as any,
    writeFile: async function(path: string, data: string | Buffer, encoding?: "utf8") {
      // In a real implementation, this would use expo-file-system
      throw new Error("File system not implemented for Expo");
    },
    stat: async function(filePath: string) {
      // In a real implementation, this would use expo-file-system
      throw new Error("File system not implemented for Expo");
    },
    mkdir: async function(filePath: string) {
      // In a real implementation, this would use expo-file-system
      throw new Error("File system not implemented for Expo");
    },
    existsSync: function(filePath: string) {
      // In a real implementation, this would use expo-file-system
      return false;
    }
  },
  crypto: {
    randomBytes: function(size: number) {
      // In a real implementation, this would use expo-crypto
      const array = new Uint8Array(size);
      for (let i = 0; i < size; i++) {
        array[i] = Math.floor(Math.random() * 256);
      }
      return Buffer.from(array);
    },
    deriveKey: async function(
      password: string | Buffer,
      salt: Buffer,
      params: { N: number; r: number; p: number; keyLen?: number }
    ) {
      // In a real implementation, this would use expo-crypto
      throw new Error("Crypto not implemented for Expo");
    },
    encrypt: function(
      aad: Buffer,
      key: Buffer,
      plaintext: Buffer
    ) {
      // In a real implementation, this would use expo-crypto
      throw new Error("Crypto not implemented for Expo");
    },
    decrypt: function(
      aad: Buffer,
      key: Buffer,
      iv: Buffer,
      tag: Buffer,
      ciphertext: Buffer
    ) {
      // In a real implementation, this would use expo-crypto
      throw new Error("Crypto not implemented for Expo");
    }
  },
  dbFactory: {
    open: async function(path: string) {
      // In a real implementation, this would use expo-sqlite
      throw new Error("Database not implemented for Expo");
    }
  }
};