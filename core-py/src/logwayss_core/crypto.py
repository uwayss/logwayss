from __future__ import annotations

import os
from typing import Tuple
import hashlib
from cryptography.hazmat.primitives.ciphers.aead import AESGCM

IV_SIZE = 12
TAG_SIZE = 16


def derive_key(password: bytes | str, salt: bytes, N: int, r: int, p: int, key_len: int = 32) -> bytes:
    """Derive a key using scrypt with given parameters.

    Args:
        password: raw bytes or UTF-8 string.
        salt: random salt bytes.
        N, r, p: scrypt parameters.
        key_len: desired key length (default 32 for AES-256).
    """
    if isinstance(password, str):
        password = password.encode("utf-8")
    return hashlib.scrypt(password=password, salt=salt, n=N, r=r, p=p, dklen=key_len)


def encrypt(aad: bytes, key: bytes, plaintext: bytes) -> Tuple[bytes, bytes, bytes]:
    """AES-256-GCM encrypt. Returns (iv12, tag16, ciphertext)."""
    iv = os.urandom(IV_SIZE)
    aesgcm = AESGCM(key)
    ct_tag = aesgcm.encrypt(iv, plaintext, aad)
    ciphertext, tag = ct_tag[:-TAG_SIZE], ct_tag[-TAG_SIZE:]
    return iv, tag, ciphertext


def decrypt(aad: bytes, key: bytes, iv: bytes, tag: bytes, ciphertext: bytes) -> bytes:
    """AES-256-GCM decrypt using provided iv and tag."""
    aesgcm = AESGCM(key)
    ct_tag = ciphertext + tag
    return aesgcm.decrypt(iv, ct_tag, aad)
