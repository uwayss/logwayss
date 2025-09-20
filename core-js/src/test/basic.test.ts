import { Core } from "../index.js";
import { nodePlatform } from "../platform-node.js";
import { mkdtemp, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";

async function runTest() {
  console.log("Starting basic core test...");
  
  const dir = await mkdtemp(join(tmpdir(), "lwx-test-"));
  console.log(`Created temp directory: ${dir}`);
  
  try {
    const core = new Core(nodePlatform);
    
    // Test profile creation
    console.log("Creating profile...");
    await core.createProfile(dir, "testpassword");
    console.log("✅ Profile created");
    
    // Test unlock
    console.log("Unlocking profile...");
    await core.unlockProfile(dir, "testpassword");
    console.log("✅ Profile unlocked");
    
    // Test entry creation
    console.log("Creating entry...");
    const entry = await core.createEntry({
      type: "text",
      payload: { content: "Hello, LogWayss!" },
      tags: ["test", "hello"]
    });
    console.log(`✅ Entry created with ID: ${entry.id}`);
    
    // Test entry retrieval
    console.log("Retrieving entry...");
    const retrieved = await core.getEntry(entry.id);
    console.log(`✅ Entry retrieved: ${JSON.stringify(retrieved.payload)}`);
    
    // Test query
    console.log("Querying entries...");
    const results = await core.query({ type: "text" });
    console.log(`✅ Found ${results.length} entries`);
    
    // Test lock
    console.log("Locking profile...");
    core.lock();
    console.log("✅ Profile locked");
    
    console.log("\n🎉 All tests passed!");
  } catch (error) {
    console.error("❌ Test failed:", error);
  } finally {
    // Cleanup
    try {
      await rm(dir, { recursive: true });
      console.log(`Cleaned up temp directory: ${dir}`);
    } catch (err) {
      console.warn("Warning: Could not clean up temp directory");
    }
  }
}

runTest();