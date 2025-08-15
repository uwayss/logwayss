export * as crypto from './crypto.js';
export * from './types.js';

import type { Entry, QueryFilter, Pagination } from './types.js';

export class Core {
  async createEntry(_entry: Entry): Promise<Entry> {
    throw new Error('not implemented');
  }
  async getEntry(_id: string): Promise<Entry> {
    throw new Error('not implemented');
  }
  async query(_filter: QueryFilter, _pagination?: Pagination): Promise<Entry[]> {
    throw new Error('not implemented');
  }
  async exportArchive(_dest: string): Promise<void> {
    throw new Error('not implemented');
  }
  async importArchive(_src: string): Promise<void> {
    throw new Error('not implemented');
  }
  async createProfile(_dataDir: string, _password: string | Buffer, _params?: { N: number; r: number; p: number; keyLen?: number }): Promise<void> {
    throw new Error('not implemented');
  }
  async unlockProfile(_dataDir: string, _password: string | Buffer): Promise<void> {
    throw new Error('not implemented');
  }
  lock(): void {
    // no-op in stub
  }
  isUnlocked(): boolean {
    return false;
  }
}
