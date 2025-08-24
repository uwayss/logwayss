import {
  Core,
  ValidationError,
  validateNewEntry,
  EntryType,
} from "../index.js";
import { mkdtemp, rm, stat } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";

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
  let createdEntryId = "";

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

    results.push(
      await test("Entries: can be created", async () => {
        const newEntry = {
          type: "text" as EntryType,
          payload: { text: "hello" },
        };
        const createdEntry = await c.createEntry(newEntry);
        if (!createdEntry.id) {
          throw new Error("createEntry returned an entry with no ID");
        }
        createdEntryId = createdEntry.id;
      }),
    );

    results.push(
      await test("Entries: can be retrieved", async () => {
        const got = await c.getEntry(createdEntryId);
        if (got.id !== createdEntryId) throw new Error("getEntry ID mismatch");
        if ((got.payload as any)?.text !== "hello") {
          throw new Error("getEntry payload mismatch");
        }
      }),
    );

    results.push(
      await test("Entries: can be queried", async () => {
        const res = await c.query({ type: "text" }, { limit: 10 });
        if (res.length !== 1 || res[0].id !== createdEntryId)
          throw new Error("query result mismatch");
      }),
    );

    results.push(
      await test("Entries: validation works", async () => {
        // Test valid entry
        const validEntry = {
          type: "text" as EntryType,
          payload: { text: "valid entry" },
        };
        await c.createEntry(validEntry);

        // Test invalid entry type
        try {
          const invalidTypeEntry = {
            type: "invalid_type" as EntryType,
            payload: { text: "invalid entry" },
          };
          await c.createEntry(invalidTypeEntry);
          throw new Error(
            "createEntry should have failed for invalid entry type",
          );
        } catch (e) {
          if (!(e instanceof ValidationError)) {
            throw new Error(
              "createEntry should throw ValidationError for invalid entry type",
            );
          }
        }

        // Test entry with too many tags
        try {
          const tooManyTags = Array(25)
            .fill(0)
            .map((_, i) => `tag${i}`);
          const tooManyTagsEntry = {
            type: "text" as EntryType,
            tags: tooManyTags,
            payload: { text: "too many tags" },
          };
          await c.createEntry(tooManyTagsEntry);
          throw new Error(
            "createEntry should have failed for entry with too many tags",
          );
        } catch (e) {
          if (!(e instanceof ValidationError)) {
            throw new Error(
              "createEntry should throw ValidationError for entry with too many tags",
            );
          }
        }

        // Test entry with tag too long
        try {
          const longTagEntry = {
            type: "text" as EntryType,
            tags: ["".padStart(55, "a")],
            payload: { text: "tag too long" },
          };
          await c.createEntry(longTagEntry);
          throw new Error(
            "createEntry should have failed for entry with tag too long",
          );
        } catch (e) {
          if (!(e instanceof ValidationError)) {
            throw new Error(
              "createEntry should throw ValidationError for entry with tag too long",
            );
          }
        }

        // Test entry with source too long
        try {
          const longSourceEntry = {
            type: "text" as EntryType,
            source: "".padStart(55, "a"),
            payload: { text: "source too long" },
          };
          await c.createEntry(longSourceEntry);
          throw new Error(
            "createEntry should have failed for entry with source too long",
          );
        } catch (e) {
          if (!(e instanceof ValidationError)) {
            throw new Error(
              "createEntry should throw ValidationError for entry with source too long",
            );
          }
        }

        // Test entry with device_id too long
        try {
          const longDeviceIDEntry = {
            type: "text" as EntryType,
            device_id: "".padStart(105, "a"),
            payload: { text: "device_id too long" },
          };
          await c.createEntry(longDeviceIDEntry);
          throw new Error(
            "createEntry should have failed for entry with device_id too long",
          );
        } catch (e) {
          if (!(e instanceof ValidationError)) {
            throw new Error(
              "createEntry should throw ValidationError for entry with device_id too long",
            );
          }
        }

        // Test entry with invalid meta confidence
        try {
          const invalidMetaEntry = {
            type: "text" as EntryType,
            meta: { confidence: 1.5 },
            payload: { text: "invalid meta" },
          };
          await c.createEntry(invalidMetaEntry);
          throw new Error(
            "createEntry should have failed for entry with invalid meta confidence",
          );
        } catch (e) {
          if (!(e instanceof ValidationError)) {
            throw new Error(
              "createEntry should throw ValidationError for entry with invalid meta confidence",
            );
          }
        }

        // Test entry with invalid meta visibility
        try {
          const invalidVisibilityEntry = {
            type: "text" as EntryType,
            meta: { visibility: "invalid" },
            payload: { text: "invalid meta" },
          };
          await c.createEntry(invalidVisibilityEntry);
          throw new Error(
            "createEntry should have failed for entry with invalid meta visibility",
          );
        } catch (e) {
          if (!(e instanceof ValidationError)) {
            throw new Error(
              "createEntry should throw ValidationError for entry with invalid meta visibility",
            );
          }
        }

        // Test entry with invalid meta sensitivity
        try {
          const invalidSensitivityEntry = {
            type: "text" as EntryType,
            meta: { sensitivity: "invalid" },
            payload: { text: "invalid meta" },
          };
          await c.createEntry(invalidSensitivityEntry);
          throw new Error(
            "createEntry should have failed for entry with invalid meta sensitivity",
          );
        } catch (e) {
          if (!(e instanceof ValidationError)) {
            throw new Error(
              "createEntry should throw ValidationError for entry with invalid meta sensitivity",
            );
          }
        }

        // Test entry without payload
        try {
          const noPayloadEntry = {
            type: "text" as EntryType,
          };
          // @ts-ignore - intentionally testing invalid entry
          await c.createEntry(noPayloadEntry);
          throw new Error(
            "createEntry should have failed for entry without payload",
          );
        } catch (e) {
          if (!(e instanceof ValidationError)) {
            throw new Error(
              "createEntry should throw ValidationError for entry without payload",
            );
          }
        }
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
        // Add a temporary entry to make the live DB different from the backup
        await c.createEntry({
          type: "text" as EntryType,
          payload: { text: "temporary" },
        });
        const preImportEntries = await c.query({});
        // We should have 3 entries now: the original "hello" entry,
        // the "valid entry" from validation test, and the temporary entry
        if (preImportEntries.length !== 3) {
          throw new Error(
            `Pre-import check failed: expected 3 entries, got ${preImportEntries.length}`,
          );
        }

        // Import the archive, which should overwrite the live DB and restore the 2-entry state
        await c.importArchive(dest);

        // After import, we should be back to the state with only the original entries
        // (the "hello" entry and the "valid entry" from validation test)
        const finalEntries = await c.query({});
        if (finalEntries.length !== 2) {
          throw new Error(
            `Post-import state is incorrect. Expected 2 entries, got ${finalEntries.length}`,
          );
        }
      }),
    );

    results.push(
      await test("All Entry Types: can be created", async () => {
        // Test all entry types
        const entryTypes: EntryType[] = [
          "text",
          "markdown",
          "metrics",
          "media_ref",
          "event",
          "log",
        ];

        for (const entryType of entryTypes) {
          let payload: any;
          switch (entryType) {
            case "text":
              payload = { text: "sample text" };
              break;
            case "markdown":
              payload = { markdown: "# Header\n\nContent" };
              break;
            case "metrics":
              payload = { steps: 1000, calories: 50 };
              break;
            case "media_ref":
              payload = { ref: "abc123", type: "image" };
              break;
            case "event":
              payload = { title: "Meeting", start: "2023-01-01T10:00:00Z" };
              break;
            case "log":
              payload = {
                source: "app",
                message: "App started",
                level: "info",
              };
              break;
          }

          const entry = {
            type: entryType,
            payload,
          };

          const createdEntry = await c.createEntry(entry);
          if (createdEntry.type !== entryType) {
            throw new Error(
              `Created entry type mismatch: got ${createdEntry.type}, want ${entryType}`,
            );
          }
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
