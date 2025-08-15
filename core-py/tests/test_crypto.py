import unittest
from logwayss_core import derive_key, encrypt, decrypt

class TestCrypto(unittest.TestCase):
    def test_roundtrip(self):
        salt = b'0' * 32
        key = derive_key('password', salt, 2**14, 8, 1, 32)
        aad = b'schema=1|id=ulid|type=text'
        iv, tag, ct = encrypt(aad, key, b'hello, logwayss')
        pt = decrypt(aad, key, iv, tag, ct)
        self.assertEqual(pt, b'hello, logwayss')

if __name__ == '__main__':
    unittest.main()
