/**
 * User profile data access — no auth session logic here.
 */

import { eq } from 'drizzle-orm'
import { users } from '@parksafe/db'
import { getDb } from '../lib/db'
import { encryptPii, decryptPii } from '../lib/pii-crypto'
import { hashPhone } from '../lib/phone'

export interface CreateUserInput {
  displayName: string
  phoneE164: string
  email?: string | null
}

export interface UserRow {
  id: string
  displayName: string
  phoneHash: string
  email: string | null
  createdAt: Date
}

/**
 * Finds a user by HMAC phone hash.
 */
export async function findUserByPhoneHash(phoneHash: string): Promise<UserRow | null> {
  const db = getDb()
  if (!db) return null

  const rows = await db
    .select()
    .from(users)
    .where(eq(users.phoneHash, phoneHash))
    .limit(1)

  const row = rows[0]
  if (!row) return null

  return {
    id: row.id,
    displayName: row.displayName,
    phoneHash: row.phoneHash,
    email: row.email ?? null,
    createdAt: row.createdAt,
  }
}

/**
 * Finds a user by ID.
 */
export async function findUserById(userId: string): Promise<UserRow | null> {
  const db = getDb()
  if (!db) return null

  const rows = await db.select().from(users).where(eq(users.id, userId)).limit(1)
  const row = rows[0]
  if (!row) return null

  return {
    id: row.id,
    displayName: row.displayName,
    phoneHash: row.phoneHash,
    email: row.email ?? null,
    createdAt: row.createdAt,
  }
}

/**
 * Creates a new user with encrypted phone.
 */
export async function createUser(input: CreateUserInput): Promise<UserRow> {
  const db = getDb()
  if (!db) throw new Error('Database not available')

  const phoneHash = hashPhone(input.phoneE164)
  const existing = await findUserByPhoneHash(phoneHash)
  if (existing) {
    throw new UserAlreadyExistsError()
  }

  const rows = await db
    .insert(users)
    .values({
      displayName: input.displayName,
      phoneHash,
      phoneEncrypted: encryptPii(input.phoneE164),
      email: input.email ?? null,
    })
    .returning()

  const row = rows[0]
  if (!row) throw new Error('Failed to create user')

  return {
    id: row.id,
    displayName: row.displayName,
    phoneHash: row.phoneHash,
    email: row.email ?? null,
    createdAt: row.createdAt,
  }
}

/**
 * Updates user profile fields.
 */
export async function updateUser(
  userId: string,
  updates: { displayName?: string; email?: string | null }
): Promise<UserRow | null> {
  const db = getDb()
  if (!db) return null

  const set: Partial<{ displayName: string; email: string | null; updatedAt: Date }> = {
    updatedAt: new Date(),
  }
  if (updates.displayName !== undefined) set.displayName = updates.displayName
  if (updates.email !== undefined) set.email = updates.email

  const rows = await db.update(users).set(set).where(eq(users.id, userId)).returning()
  const row = rows[0]
  if (!row) return null

  return {
    id: row.id,
    displayName: row.displayName,
    phoneHash: row.phoneHash,
    email: row.email ?? null,
    createdAt: row.createdAt,
  }
}

/**
 * Decrypts owner phone for server-side relay only.
 */
export async function decryptOwnerPhone(userId: string): Promise<string | null> {
  const db = getDb()
  if (!db) return null

  const rows = await db
    .select({ phoneEncrypted: users.phoneEncrypted })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1)

  const encrypted = rows[0]?.phoneEncrypted
  if (!encrypted) return null
  return decryptPii(encrypted)
}

export class UserAlreadyExistsError extends Error {
  constructor() {
    super('User already exists')
    this.name = 'UserAlreadyExistsError'
  }
}
