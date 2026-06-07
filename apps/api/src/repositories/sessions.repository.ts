/**
 * Refresh token session storage — supports rotation and reuse detection.
 */

import { and, eq, isNull } from 'drizzle-orm'
import { authSessions } from '@parksafe/db'
import { getDb } from '../lib/db'

export interface SessionRow {
  id: string
  userId: string
  refreshTokenHash: string
  familyId: string
  expiresAt: Date
  revokedAt: Date | null
}

/**
 * Inserts a new refresh session row.
 */
export async function insertSession(input: {
  userId: string
  refreshTokenHash: string
  familyId: string
  expiresAt: Date
}): Promise<SessionRow> {
  const db = getDb()
  if (!db) throw new Error('Database not available')

  const rows = await db
    .insert(authSessions)
    .values({
      userId: input.userId,
      refreshTokenHash: input.refreshTokenHash,
      familyId: input.familyId,
      expiresAt: input.expiresAt,
    })
    .returning()

  const row = rows[0]
  if (!row) throw new Error('Failed to create session')

  return mapRow(row)
}

/**
 * Finds an active (non-revoked) session by refresh token hash.
 */
export async function findActiveSessionByHash(
  refreshTokenHash: string
): Promise<SessionRow | null> {
  const db = getDb()
  if (!db) return null

  const rows = await db
    .select()
    .from(authSessions)
    .where(
      and(eq(authSessions.refreshTokenHash, refreshTokenHash), isNull(authSessions.revokedAt))
    )
    .limit(1)

  const row = rows[0]
  return row ? mapRow(row) : null
}

/**
 * Finds any session by hash including revoked — for reuse detection.
 */
export async function findSessionByHash(refreshTokenHash: string): Promise<SessionRow | null> {
  const db = getDb()
  if (!db) return null

  const rows = await db
    .select()
    .from(authSessions)
    .where(eq(authSessions.refreshTokenHash, refreshTokenHash))
    .limit(1)

  const row = rows[0]
  return row ? mapRow(row) : null
}

/**
 * Revokes a single session by ID.
 */
export async function revokeSessionById(sessionId: string): Promise<void> {
  const db = getDb()
  if (!db) return

  await db
    .update(authSessions)
    .set({ revokedAt: new Date() })
    .where(eq(authSessions.id, sessionId))
}

/**
 * Revokes all sessions in a rotation family — triggered on token reuse.
 */
export async function revokeFamily(familyId: string): Promise<void> {
  const db = getDb()
  if (!db) return

  await db
    .update(authSessions)
    .set({ revokedAt: new Date() })
    .where(and(eq(authSessions.familyId, familyId), isNull(authSessions.revokedAt)))
}

/**
 * Revokes all sessions for a user.
 */
export async function revokeAllUserSessions(userId: string): Promise<void> {
  const db = getDb()
  if (!db) return

  await db
    .update(authSessions)
    .set({ revokedAt: new Date() })
    .where(and(eq(authSessions.userId, userId), isNull(authSessions.revokedAt)))
}

function mapRow(row: typeof authSessions.$inferSelect): SessionRow {
  return {
    id: row.id,
    userId: row.userId,
    refreshTokenHash: row.refreshTokenHash,
    familyId: row.familyId,
    expiresAt: row.expiresAt,
    revokedAt: row.revokedAt,
  }
}
