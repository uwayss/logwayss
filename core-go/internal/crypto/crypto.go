package crypto

import (
	"crypto/aes"
	"crypto/cipher"
	"crypto/rand"
	"fmt"

	"golang.org/x/crypto/scrypt"
)

const (
	IVSize  = 12
	TagSize = 16
)

// GenerateSalt creates a random salt of the given size.
func GenerateSalt(size int) ([]byte, error) {
	salt := make([]byte, size)
	if _, err := rand.Read(salt); err != nil {
		return nil, err
	}
	return salt, nil
}

// DeriveKey derives a key using scrypt with the given parameters.
func DeriveKey(password, salt []byte, N, r, p, keyLen int) ([]byte, error) {
	return scrypt.Key(password, salt, N, r, p, keyLen)
}

// Encrypt performs AES-256-GCM with 12-byte IV and returns iv, tag, ciphertext.
func Encrypt(aad, key, plaintext []byte) (iv, tag, ciphertext []byte, err error) {
	block, err := aes.NewCipher(key)
	if err != nil {
		return nil, nil, nil, err
	}
	gcm, err := cipher.NewGCM(block)
	if err != nil {
		return nil, nil, nil, err
	}
	iv = make([]byte, IVSize)
	if _, err = rand.Read(iv); err != nil {
		return nil, nil, nil, err
	}
	out := gcm.Seal(nil, iv, plaintext, aad)
	over := gcm.Overhead()
	if len(out) < over {
		return nil, nil, nil, fmt.Errorf("gcm output too short: %d", len(out))
	}
	ciphertext = make([]byte, len(out)-over)
	copy(ciphertext, out[:len(out)-over])
	tag = make([]byte, over)
	copy(tag, out[len(out)-over:])
	return iv, tag, ciphertext, nil
}

// Decrypt performs AES-256-GCM decryption with provided iv and tag.
func Decrypt(aad, key, iv, tag, ciphertext []byte) ([]byte, error) {
	block, err := aes.NewCipher(key)
	if err != nil {
		return nil, err
	}
	gcm, err := cipher.NewGCM(block)
	if err != nil {
		return nil, err
	}
	buf := make([]byte, 0, len(ciphertext)+len(tag))
	buf = append(buf, ciphertext...)
	buf = append(buf, tag...)
	return gcm.Open(nil, iv, buf, aad)
}
