import unittest
import tempfile
import uuid
from pathlib import Path
from logwayss_core import Core

class TestClientFlowSmoke(unittest.TestCase):
    def test_full_client_flow(self):
        """Runs the full API lifecycle for core-py"""
        core = Core()
        password = "password"
        
        with tempfile.TemporaryDirectory() as tmpdir:
            # Step 1: Profile Creation
            core.create_profile(tmpdir, password, N=1 << 14, r=8, p=1)
            self.assertTrue((Path(tmpdir) / "profile.json").exists(), "Profile file was not created")

            # Step 2: Profile Unlock and Lock
            core.unlock_profile(tmpdir, password)
            self.assertTrue(core.is_unlocked(), "Core should be unlocked after unlock_profile")
            
            core.lock()
            self.assertFalse(core.is_unlocked(), "Core should be locked after lock()")

            # Step 3: CRUD and Query
            core.unlock_profile(tmpdir, password)
            entry_id = str(uuid.uuid4())
            entry = {
                "id": entry_id,
                "type": "text",
                "payload": {"message": "hello python"},
                "tags": ["test", "py"],
            }
            core.create_entry(entry)
            
            retrieved = core.get_entry(entry_id)
            self.assertEqual(retrieved["id"], entry_id)
            self.assertEqual(retrieved["payload"]["message"], "hello python")
            
            results = core.query({})
            self.assertEqual(len(results), 1)
            self.assertEqual(results[0]["id"], entry_id)

            # Step 4: Export and Import
            export_path = Path(tmpdir) / "export.lwx"
            core.export_archive(str(export_path))
            self.assertTrue(export_path.exists() and export_path.stat().st_size > 0, "Export file was not created or is empty")
            self.assertTrue(core.is_unlocked(), "Core should remain unlocked after export")
            
            # Create a second entry to ensure the import restores the previous state
            core.create_entry({"id": str(uuid.uuid4()), "type": "temp", "payload": {}})
            self.assertEqual(len(core.query({})), 2, "Second entry was not created before import")
            
            core.import_archive(str(export_path))
            self.assertTrue(core.is_unlocked(), "Core should remain unlocked after import")
            
            final_results = core.query({})
            self.assertEqual(len(final_results), 1, "Database state was not restored after import")
            self.assertEqual(final_results[0]["id"], entry_id)

if __name__ == "__main__":
    unittest.main()