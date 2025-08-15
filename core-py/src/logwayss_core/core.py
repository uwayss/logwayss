from __future__ import annotations

from typing import Any, Dict, List, Optional


class Core:
    """Python Core stub exposing the public API per spec.

    All methods raise NotImplementedError for now so end-to-end smoke tests can
    assert/skip until implementations land.
    """

    # Profile & Session lifecycle
    def create_profile(self, data_dir: str, password: bytes | str, *, N: int, r: int, p: int, key_len: int = 32) -> None:
        raise NotImplementedError

    def unlock_profile(self, data_dir: str, password: bytes | str) -> None:
        raise NotImplementedError

    def lock(self) -> None:
        # no-op in stub
        pass

    def is_unlocked(self) -> bool:
        return False

    # Entries & Query
    def create_entry(self, entry: Dict[str, Any]) -> Dict[str, Any]:
        raise NotImplementedError

    def get_entry(self, entry_id: str) -> Dict[str, Any]:
        raise NotImplementedError

    def query(self, filter: Dict[str, Any], pagination: Optional[Dict[str, int]] = None) -> List[Dict[str, Any]]:
        raise NotImplementedError

    # Export / Import
    def export_archive(self, dest: str) -> None:
        raise NotImplementedError

    def import_archive(self, src: str) -> None:
        raise NotImplementedError
