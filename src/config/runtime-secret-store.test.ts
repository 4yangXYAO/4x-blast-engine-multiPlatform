import { describe, it, expect, beforeEach } from 'vitest'
import { encryptRuntimeSecret, decryptRuntimeSecret } from '../config/runtime-secret-store'

describe('runtime-secret-store', () => {
  beforeEach(() => {
    process.env.JWT_SECRET = 'test-secret-key-must-be-at-least-32-chars-long'
    process.env.ENCRYPTION_KEY = 'test-encryption-key-must-be-32-chars'
  })

  it('should encrypt and decrypt correctly', () => {
    const plaintext = 'my-api-token-12345'
    const encrypted = encryptRuntimeSecret(plaintext)
    const decrypted = decryptRuntimeSecret(encrypted)
    expect(decrypted).toBe(plaintext)
  })

  it('should produce different ciphertexts for same plaintext', () => {
    const plaintext = 'same-text'
    const encrypted1 = encryptRuntimeSecret(plaintext)
    const encrypted2 = encryptRuntimeSecret(plaintext)
    expect(encrypted1).not.toBe(encrypted2)
  })

  it('should throw on invalid base64', () => {
    expect(() => decryptRuntimeSecret('not-valid-base64!!!')).toThrow()
  })

  it('should throw on tampered ciphertext', () => {
    const encrypted = encryptRuntimeSecret('secret')
    const tampered = encrypted.slice(0, -2) + 'XX'
    expect(() => decryptRuntimeSecret(tampered)).toThrow()
  })
})