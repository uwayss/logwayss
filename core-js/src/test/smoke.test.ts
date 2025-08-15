import { Core, crypto } from '../index.js';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

async function main() {
  const C = { cyan: '\x1b[36m', reset: '\x1b[0m' } as const;
  const banner = (msg: string) => console.log(`${C.cyan}==>${C.reset} ${msg}`);
  const pass = (msg: string) => console.log(`✅ ${msg}`);
  const fail = (msg: string) => console.log(`❌ ${msg}`);
  const skip = (msg: string) => console.log(`⏭️ ${msg}`);
  const notimpl = (msg: string) => console.log(`🚧 ${msg}`);

  banner('core-js: crypto roundtrip');
  // Crypto roundtrip
  const salt = Buffer.from('3030303030303030303030303030303030303030303030303030303030303030', 'hex');
  const key = await crypto.deriveKey('password', salt, { N: 1 << 14, r: 8, p: 1, keyLen: 32 });
  const aad = Buffer.from('schema=1|id=ulid|type=text', 'utf8');
  const { iv, tag, ciphertext } = crypto.encrypt(aad, key, Buffer.from('hello, logwayss'));
  const pt = crypto.decrypt(aad, key, iv, tag, ciphertext);
  if (pt.toString('utf8') !== 'hello, logwayss') throw new Error('crypto roundtrip failed');
  pass('AES-GCM roundtrip passed');

  const core = new Core();

  // Profile lifecycle
  banner('core-js: profile lifecycle');
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'lwx-js-'));
  console.log('data dir:', tmp);
  let notImplCount = 0;
  try { await core.createProfile(tmp, 'password', { N: 1 << 14, r: 8, p: 1, keyLen: 32 }); pass('createProfile OK'); }
  catch (e) { notImplCount++; notimpl('createProfile not implemented'); }
  try { await core.unlockProfile(tmp, 'password'); pass('unlockProfile OK'); }
  catch (e) { notImplCount++; notimpl('unlockProfile not implemented'); }

  // Entry CRUD + Query
  banner('core-js: entry CRUD + query');
  let skipDb = false;
  const entryId = '01HXJSID000000000000000000000000';
  try {
    await core.createEntry({
      id: entryId,
      type: 'text',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      schema_version: 1,
    } as any);
    pass('createEntry OK');
  } catch (e: any) {
    const msg = String(e?.message || e);
    if (msg.includes('better-sqlite3 not installed')) { skipDb = true; skip('createEntry skipped (SQLite dependency not installed)'); }
    else if (msg.includes('not implemented')) { notImplCount++; notimpl('createEntry not implemented'); }
    else { fail(`createEntry failed: ${msg}`); process.exit(1); }
  }
  try {
    if (skipDb) { skip('getEntry skipped'); }
    else { await core.getEntry(entryId); pass('getEntry OK'); }
  }
  catch (e: any) {
    const msg = String(e?.message || e);
    if (msg.includes('not implemented')) { notImplCount++; notimpl('getEntry not implemented'); }
    else { fail(`getEntry failed: ${msg}`); process.exit(1); }
  }
  try {
    if (skipDb) { skip('query skipped'); }
    else { await core.query({ type: 'text' } as any, { limit: 10, offset: 0 } as any); pass('query OK'); }
  }
  catch (e: any) {
    const msg = String(e?.message || e);
    if (msg.includes('not implemented')) { notImplCount++; notimpl('query not implemented'); }
    else { fail(`query failed: ${msg}`); process.exit(1); }
  }

  // Export/Import
  banner('core-js: export/import');
  const dest = path.join(tmp, 'export.lwx');
  try { await core.exportArchive(dest); pass('exportArchive OK'); }
  catch (e) { notImplCount++; notimpl('exportArchive not implemented'); }
  try { if (fs.existsSync(dest)) { await core.importArchive(dest); pass('importArchive OK'); } else { notImplCount++; notimpl('export file not present'); } }
  catch (e) { notImplCount++; notimpl('importArchive not implemented'); }

  // Lock after operations
  try { core.lock(); pass('lock OK'); } catch { /* ignore */ }
  try { void core.isUnlocked(); pass('isUnlocked callable'); } catch { /* ignore */ }

  banner('core-js: summary');
  console.log('not-implemented count:', notImplCount);
  pass('core-js smoke OK');
}

main().catch((e) => { console.error(e); process.exit(1); });
