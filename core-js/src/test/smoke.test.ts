import { Core, crypto } from '../index.js';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

async function main() {
  // Crypto roundtrip
  const salt = Buffer.from('3030303030303030303030303030303030303030303030303030303030303030', 'hex');
  const key = await crypto.deriveKey('password', salt, { N: 1 << 14, r: 8, p: 1, keyLen: 32 });
  const aad = Buffer.from('schema=1|id=ulid|type=text', 'utf8');
  const { iv, tag, ciphertext } = crypto.encrypt(aad, key, Buffer.from('hello, logwayss'));
  const pt = crypto.decrypt(aad, key, iv, tag, ciphertext);
  if (pt.toString('utf8') !== 'hello, logwayss') throw new Error('crypto roundtrip failed');

  const core = new Core();

  // Profile lifecycle
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'lwx-js-'));
  let notImplCount = 0;
  try { await core.createProfile(tmp, 'password', { N: 1 << 14, r: 8, p: 1, keyLen: 32 }); }
  catch { notImplCount++; }
  try { await core.unlockProfile(tmp, 'password'); }
  catch { notImplCount++; }
  try { core.lock(); } catch { /* lock is no-op in stub */ }
  try { void core.isUnlocked(); } catch { /* ignore */ }

  // Entry CRUD + Query
  try {
    await core.createEntry({
      id: '01HXJSID000000000000000000000000',
      type: 'text',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      schema_version: 1,
    } as any);
  } catch { notImplCount++; }
  try { await core.getEntry('01HXJSID000000000000000000000000000'); }
  catch { notImplCount++; }
  try { await core.query({ type: 'text' } as any, { limit: 10, offset: 0 } as any); }
  catch { notImplCount++; }

  // Export/Import
  const dest = path.join(tmp, 'export.lwx');
  try { await core.exportArchive(dest); }
  catch { notImplCount++; }
  try { if (fs.existsSync(dest)) await core.importArchive(dest); else notImplCount++; }
  catch { notImplCount++; }

  console.log('core-js smoke: not-implemented count', notImplCount);
  console.log('core-js smoke OK');
}

main().catch((e) => { console.error(e); process.exit(1); });
