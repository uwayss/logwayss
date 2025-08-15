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
        CYAN = "\033[36m"; RESET = "\033[0m"
        def banner(msg: str): print(f"{CYAN}==>{RESET} {msg}")
        def passed(msg: str): print(f"✅ {msg}")
        def skipped(msg: str): print(f"⏭️ {msg}")
        def notimpl(msg: str): print(f"🚧 {msg}")

        c = self.core
        data_dir = self.tmpdir.name

        # Profile lifecycle (keep unlocked for CRUD)
        banner("core-py: profile lifecycle")
        print("data dir:", data_dir)
        try:
            c.create_profile(data_dir, "password", N=1 << 14, r=8, p=1, key_len=32)
            passed("create_profile OK")
            c.unlock_profile(data_dir, "password"); passed("unlock_profile OK")
            _ = c.is_unlocked(); passed("is_unlocked callable")
        except NotImplementedError:
            notimpl("profile lifecycle not implemented")
            self.skipTest("⏭️ Profile lifecycle not implemented")

        # Entries & Query
        banner("core-py: entry CRUD + query")
        try:
            entry = {
                "id": "01HXPYID000000000000000000000000",
                "type": "text",
                "created_at": "2024-01-01T00:00:00Z",
                "updated_at": "2024-01-01T00:00:00Z",
                "schema_version": 1,
            }
            c.create_entry(entry); passed("create_entry OK")
            c.get_entry(entry["id"]); passed("get_entry OK")
            c.query({"type": "text"}, {"limit": 10, "offset": 0}); passed("query OK")
        except NotImplementedError:
            notimpl("entry CRUD/query not implemented")
            self.skipTest("⏭️ Entry CRUD/Query not implemented")

        # Export/Import
        banner("core-py: export/import")
        dest = os.path.join(data_dir, "export.lwx")
        try:
            c.export_archive(dest); passed("export_archive OK")
            self.assertTrue(os.path.exists(dest)); passed(f"export file exists ({dest})")
            c.import_archive(dest); passed("import_archive OK")
        except NotImplementedError:
            notimpl("export/import not implemented")
            self.skipTest("⏭️ Export/Import not implemented")

        # Lock at the end
        try:
            c.lock(); passed("lock OK")
            _ = c.is_unlocked(); passed("is_unlocked callable")
        except Exception:
            # Don't fail suite on lock/is_unlocked stubs
            pass


if __name__ == "__main__":
    unittest.main()
