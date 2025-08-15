import os
import tempfile
import unittest

from logwayss_core import Core


class TestClientFlowSmoke(unittest.TestCase):
    def setUp(self):
        self.core = Core()
        self.tmpdir = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmpdir.cleanup)

    def test_full_client_flow(self):
        c = self.core
        data_dir = self.tmpdir.name

        # Profile lifecycle
        try:
            c.create_profile(data_dir, "password", N=1 << 14, r=8, p=1, key_len=32)
            c.unlock_profile(data_dir, "password")
            _ = c.is_unlocked()
            c.lock()
        except NotImplementedError:
            self.skipTest("Profile lifecycle not implemented")

        # Entries & Query
        try:
            entry = {
                "id": "01HXPYID000000000000000000000000",
                "type": "text",
                "created_at": "2024-01-01T00:00:00Z",
                "updated_at": "2024-01-01T00:00:00Z",
                "schema_version": 1,
            }
            c.create_entry(entry)
            c.get_entry(entry["id"])
            c.query({"type": "text"}, {"limit": 10, "offset": 0})
        except NotImplementedError:
            self.skipTest("Entry CRUD/Query not implemented")

        # Export/Import
        dest = os.path.join(data_dir, "export.lwx")
        try:
            c.export_archive(dest)
            self.assertTrue(os.path.exists(dest))
            c.import_archive(dest)
        except NotImplementedError:
            self.skipTest("Export/Import not implemented")


if __name__ == "__main__":
    unittest.main()
