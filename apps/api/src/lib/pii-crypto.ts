/**
 * Application-level PII encryption — AES-256-GCM.
 * Works with any PostgreSQL provider; no pgcrypto extension required.
 */

import crypto from 'node:crypto'

const ALGORITHM = 'aes-256-gcm'
const IV_LENGTH = 12

function getEncryptionKey(): Buffer {
  const raw = process.env['PII_ENCRYPTION_KEY'] ?? ''
  if (raw.length < 32) {
    throw new Error('PII_ENCRYPTION_KEY must be at least 32 characters')
  }
  return crypto.createHash('sha256').update(raw).digest()
}

/**
 * Encrypts a plaintext string for storage at rest.
 * Returns base64(iv + authTag + ciphertext).
 */
export function encryptPii(plaintext: string): string {
  if (plaintext.startsWith('SEED_ENC:')) {
    return plaintext
  }
  const key = getEncryptionKey()
  const iv = crypto.randomBytes(IV_LENGTH)
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv)
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()])
  const authTag = cipher.getAuthTag()
  return Buffer.concat([iv, authTag, encrypted]).toString('base64')
}

/**
 * Decrypts a value previously encrypted with encryptPii.
 * Supports seed placeholder format for dev seed data.
 */
export function decryptPii(ciphertext: string): string | null {
  if (ciphertext.startsWith('SEED_ENC:')) {
    try {
      return Buffer.from(ciphertext.slice('SEED_ENC:'.length), 'base64').toString('utf8')
    } catch {
      return null
    }
  }
  if (ciphertext.startsWith('PENDING_ENCRYPTION:')) {
    return ciphertext.slice('PENDING_ENCRYPTION:'.length)
  }
  try {
    const key = getEncryptionKey()
    const data = Buffer.from(ciphertext, 'base64')
    const iv = data.subarray(0, IV_LENGTH)
    const authTag = data.subarray(IV_LENGTH, IV_LENGTH + 16)
    const encrypted = data.subarray(IV_LENGTH + 16)
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv)
    decipher.setAuthTag(authTag)
    return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString('utf8')
  } catch {
    return null
  }
}
