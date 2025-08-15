package crypto

import (
	"bytes"
	"testing"
)

func TestEncryptDecryptRoundtrip(t *testing.T) {
	key := make([]byte, 32)
	for i := range key { key[i] = byte(i) }
	plaintext := []byte("hello, logwayss")
	aad := []byte("schema=1|id=ulid|type=text")
	iv, tag, ct, err := Encrypt(aad, key, plaintext)
	if err != nil { t.Fatalf("encrypt: %v", err) }
	pt2, err := Decrypt(aad, key, iv, tag, ct)
	if err != nil { t.Fatalf("decrypt: %v", err) }
	if !bytes.Equal(plaintext, pt2) { t.Fatalf("roundtrip mismatch") }
	if len(iv) != IVSize { t.Fatalf("iv size: %d", len(iv)) }
	if len(tag) != TagSize { t.Fatalf("tag size: %d", len(tag)) }
}

func TestScryptLen(t *testing.T) {
	pass := []byte("password")
	salt := []byte("0123456789abcdef0123456789abcdef")
	key, err := DeriveKey(pass, salt, 1<<15, 8, 1, 32)
	if err != nil { t.Fatalf("derive: %v", err) }
	if len(key) != 32 { t.Fatalf("key len: %d", len(key)) }
}
