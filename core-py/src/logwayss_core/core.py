from __future__ import annotations

import json
import os
import shutil
import sqlite3
from pathlib import Path
from typing import Any, Dict, List, Optional
import datetime

from . import crypto

SCHEMA_VERSION = 1
PROFILE_MAGIC = "LOGWAYSS_PROFILE"
DB_FILE_NAME = "db.sqlite3"
PROFILE_FILE_NAME = "profile.json"

SCHEMA_SQL = """
CREATE TABLE IF NOT EXISTS entries (
    id TEXT PRIMARY KEY,
    type TEXT NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    schema_version INTEGER NOT NULL,
    source TEXT,
    device_id TEXT,
    meta_json TEXT,
    payload BLOB NOT NULL,
    iv BLOB NOT NULL,
    tag BLOB NOT NULL
);
CREATE TABLE IF NOT EXISTS entry_tags (
    entry_id TEXT NOT NULL,
    tag TEXT NOT NULL,
    PRIMARY KEY (entry_id, tag),
    FOREIGN KEY (entry_id) REFERENCES entries(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_entries_type ON entries(type);
CREATE INDEX IF NOT EXISTS idx_entries_created_at ON entries(created_at);
CREATE INDEX IF NOT EXISTS idx_entry_tags_tag ON entry_tags(tag);
"""


class Core:
    """Python Core implementation exposing the public API per spec."""

    def __init__(self) -> None:
        self._session_key: Optional[bytes] = None
        self._data_dir: Optional[Path] = None
        self._db: Optional[sqlite3.Connection] = None

    def _get_db(self) -> sqlite3.Connection:
        if not self._data_dir:
            raise RuntimeError("Profile is locked")
        if self._db:
            return self._db
        
        db_path = self._data_dir / DB_FILE_NAME
        self._db = sqlite3.connect(db_path, check_same_thread=False, isolation_level=None)
        self._db.row_factory = sqlite3.Row
        self._db.execute("PRAGMA journal_mode = WAL;")
        self._db.execute("PRAGMA foreign_keys = ON;")
        self._db.executescript(SCHEMA_SQL)
        return self._db

    # Profile & Session lifecycle
    def create_profile(self, data_dir: str, password: bytes | str, *, N: int, r: int, p: int, key_len: int = 32) -> None:
        data_dir_path = Path(data_dir)
        profile_path = data_dir_path / PROFILE_FILE_NAME
        if profile_path.exists():
            raise FileExistsError("Profile already exists")
        data_dir_path.mkdir(parents=True, exist_ok=True)

        salt = os.urandom(32)
        key = crypto.derive_key(password, salt, N=N, r=r, p=p, key_len=key_len)
        
        payload_obj = {
            "magic": PROFILE_MAGIC,
            "schema_version": SCHEMA_VERSION,
            "created_at": datetime.datetime.now(datetime.timezone.utc).isoformat(),
        }
        payload = json.dumps(payload_obj).encode("utf-8")
        aad = f"schema={SCHEMA_VERSION}|type=profile".encode("utf-8")

        iv, tag, ciphertext = crypto.encrypt(aad, key, payload)

        profile_file = {
            "schema_version": SCHEMA_VERSION,
            "scrypt": {"N": N, "r": r, "p": p},
            "salt": salt.hex(),
            "iv": iv.hex(),
            "tag": tag.hex(),
            "ciphertext": ciphertext.hex(),
        }
        profile_path.write_text(json.dumps(profile_file, indent=2))

    def unlock_profile(self, data_dir: str, password: bytes | str) -> None:
        p = Path(data_dir)
        profile_path = p / PROFILE_FILE_NAME
        parsed = json.loads(profile_path.read_text())

        scrypt_params = parsed["scrypt"]
        salt = bytes.fromhex(parsed["salt"])
        key = crypto.derive_key(password, salt, **scrypt_params, key_len=32)

        aad = f"schema={parsed['schema_version']}|type=profile".encode("utf-8")
        iv = bytes.fromhex(parsed["iv"])
        tag = bytes.fromhex(parsed["tag"])
        ciphertext = bytes.fromhex(parsed["ciphertext"])

        plaintext = crypto.decrypt(aad, key, iv, tag, ciphertext)
        payload = json.loads(plaintext)

        if payload.get("magic") != PROFILE_MAGIC:
            raise ValueError("Invalid profile or password")

        self._session_key = key
        self._data_dir = p
        self._get_db() # Initialize DB connection

    def lock(self) -> None:
        if self._db:
            self._db.close()
        self._session_key = None
        self._data_dir = None
        self._db = None

    def is_unlocked(self) -> bool:
        return self._session_key is not None and self._data_dir is not None

    # Entries & Query
    def create_entry(self, entry: Dict[str, Any]) -> Dict[str, Any]:
        if not self.is_unlocked() or not self._session_key:
            raise RuntimeError("Profile is locked")

        now = datetime.datetime.now(datetime.timezone.utc).isoformat()
        entry.setdefault("created_at", now)
        entry.setdefault("updated_at", now)
        entry.setdefault("schema_version", SCHEMA_VERSION)
        
        payload = json.dumps(entry.get("payload")).encode("utf-8")
        aad = f"schema={entry['schema_version']}|id={entry['id']}|type={entry['type']}".encode("utf-8")
        iv, tag, ciphertext = crypto.encrypt(aad, self._session_key, payload)
        
        db = self._get_db()
        db.execute(
            """
            INSERT INTO entries (id, type, created_at, updated_at, schema_version, source, device_id, meta_json, payload, iv, tag)
            VALUES (:id, :type, :created_at, :updated_at, :schema_version, :source, :device_id, :meta_json, :payload, :iv, :tag)
            """,
            {
                "id": entry["id"],
                "type": entry["type"],
                "created_at": entry["created_at"],
                "updated_at": entry["updated_at"],
                "schema_version": entry["schema_version"],
                "source": entry.get("source"),
                "device_id": entry.get("device_id"),
                "meta_json": json.dumps(entry.get("meta")),
                "payload": ciphertext,
                "iv": iv,
                "tag": tag,
            },
        )
        tags = entry.get("tags", [])
        if tags:
            db.executemany(
                "INSERT OR IGNORE INTO entry_tags (entry_id, tag) VALUES (?, ?)",
                [(entry["id"], tag) for tag in tags],
            )
        return entry

    def get_entry(self, entry_id: str) -> Dict[str, Any]:
        if not self.is_unlocked() or not self._session_key:
            raise RuntimeError("Profile is locked")
        db = self._get_db()
        row = db.execute("SELECT * FROM entries WHERE id = ?", (entry_id,)).fetchone()
        if not row:
            raise LookupError(f"Entry with id {entry_id} not found")

        aad = f"schema={row['schema_version']}|id={row['id']}|type={row['type']}".encode("utf-8")
        payload_bytes = crypto.decrypt(aad, self._session_key, row["iv"], row["tag"], row["payload"])
        
        tags_rows = db.execute("SELECT tag FROM entry_tags WHERE entry_id = ?", (entry_id,)).fetchall()

        return {
            "id": row["id"],
            "type": row["type"],
            "created_at": row["created_at"],
            "updated_at": row["updated_at"],
            "schema_version": row["schema_version"],
            "source": row["source"],
            "device_id": row["device_id"],
            "meta": json.loads(row["meta_json"]) if row["meta_json"] else None,
            "payload": json.loads(payload_bytes),
            "tags": [r["tag"] for r in tags_rows],
        }

    def query(self, filter: Dict[str, Any], pagination: Optional[Dict[str, int]] = None) -> List[Dict[str, Any]]:
        if not self.is_unlocked():
            raise RuntimeError("Profile is locked")
        db = self._get_db()
        rows = db.execute("SELECT id FROM entries ORDER BY created_at DESC").fetchall()
        return [self.get_entry(row["id"]) for row in rows]

    # Export / Import
    def export_archive(self, dest: str) -> None:
        if not self.is_unlocked() or not self._data_dir:
            raise RuntimeError("Profile is locked")
        
        db_path = self._data_dir / DB_FILE_NAME
        
        if self._db:
            self._db.close()
            self._db = None

        shutil.copyfile(db_path, dest)
        self._get_db() # Re-establish connection

    def import_archive(self, src: str) -> None:
        if not self.is_unlocked() or not self._data_dir:
            raise RuntimeError("Profile is locked")
        
        db_path = self._data_dir / DB_FILE_NAME
        
        if self._db:
            self._db.close()
            self._db = None

        for suffix in ["", "-wal", "-shm"]:
            p = self._data_dir / f"{DB_FILE_NAME}{suffix}"
            if p.exists():
                p.unlink()
        
        shutil.copyfile(src, db_path)
        self._get_db() # Re-establish connection