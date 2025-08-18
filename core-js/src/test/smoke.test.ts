import { Core } from "../index.js";
import { mkdtemp, rm, stat } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { randomUUID } from "node:crypto";

interface TestResult {
  name: string;
  passed: boolean;
  error?: Error;
}

const test = async (
  name: string,
  fn: () => Promise<void>,
): Promise<TestResult> => {
  try {
    await fn();
    return { name, passed: true };
  } catch (e: any) {
    return { name, passed: false, error: e };
  }
};

async function runAllTests() {
  const results: TestResult[] = [];
  const c = new Core();
  const dir = await mkdtemp(join(tmpdir(), "lwx-js-"));
  const pass = "password";

  try {
    results.push(
      await test("Profile: can be created", async () => {
        await c.createProfile(dir, pass);
      }),
    );

    results.push(
      await test("Profile: can be unlocked", async () => {
        await c.unlockProfile(dir, pass);
        if (!c.isUnlocked())
          throw new Error("isUnlocked returned false after unlock");
      }),
    );

    const entryId = randomUUID();
    results.push(
      await test("Entries: can be created", async () => {
        const entry = {
          id: entryId,
          type: "text",
          schema_version: 1,
          payload: { text: "hello" },
        };
        await c.createEntry(entry as any);
      }),
    );

    results.push(
      await test("Entries: can be retrieved", async () => {
        const got = await c.getEntry(entryId);
        if (got.id !== entryId) throw new Error("getEntry ID mismatch");
      }),
    );

    results.push(
      await test("Entries: can be queried", async () => {
        const res = await c.query({ type: "text" }, { limit: 10 });
        if (res.length !== 1 || res[0].id !== entryId)
          throw new Error("query result mismatch");
      }),
    );

    const dest = join(dir, "export.lwx");
    results.push(
      await test("Archive: can be exported", async () => {
        await c.exportArchive(dest);
        await stat(dest);
      }),
    );

    results.push(
      await test("Archive: can be imported", async () => {
        // Add a second, temporary entry to make the live DB different from the backup
        await c.createEntry({
          id: randomUUID(),
          type: "temporary-entry",
        } as any);
        const preImportEntries = await c.query({});
        if (preImportEntries.length !== 2) {
          throw new Error(
            `Pre-import check failed: expected 2 entries, got ${preImportEntries.length}`,
          );
        }

        // Import the archive, which should overwrite the live DB and restore the 1-entry state
        await c.importArchive(dest);

        // After import, we should be back to the state with only the first entry
        const finalEntries = await c.query({});
        if (finalEntries.length !== 1 || finalEntries[0].id !== entryId) {
          throw new Error(
            `Post-import state is incorrect. Expected 1 entry, got ${finalEntries.length}`,
          );
        }
      }),
    );

    results.push(
      await test("Profile: can be locked", async () => {
        c.lock();
        if (c.isUnlocked())
          throw new Error("isUnlocked returned true after lock");
      }),
    );
  } finally {
    await rm(dir, { recursive: true, force: true }).catch(() => {});
  }

  // --- Final Summary ---
  let failures = 0;
  const failedTests: TestResult[] = [];

  for (const res of results) {
    console.log(`  ${res.passed ? "✅" : "❌"} ${res.name}`);
    if (!res.passed) {
      failures++;
      failedTests.push(res);
    }
  }

  if (failures > 0) {
    console.error(`\n--- Failures (${failures}) ---`);
    for (const res of failedTests) {
      console.error(`\n❌ ${res.name}`);
      console.error(res.error);
    }
    process.exit(1);
  }
}

runAllTests();
