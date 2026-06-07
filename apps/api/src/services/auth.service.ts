/**
 * Custom JWT auth — access tokens + opaque rotating refresh tokens.
 */

import crypto from 'node:crypto'
import { SignJWT, jwtVerify } from 'jose'
import {
  findActiveSessionByHash,
  findSessionByHash,
  insertSession,
  revokeFamily,
  revokeSessionById,
  revokeAllUserSessions,
} from '../repositories/sessions.repository'

const ACCESS_TTL_SECONDS = Number(process.env['JWT_ACCESS_TTL'] ?? 900)
const REFRESH_TTL_SECONDS = Number(process.env['JWT_REFRESH_TTL'] ?? 2_592_000)

export interface TokenPair {
  accessToken: string
  refreshToken: string
  userId: string
}

export class AuthError extends Error {
  constructor(
    message: string,
    public readonly code: 'INVALID_TOKEN' | 'EXPIRED' | 'REUSE_DETECTED' | 'REVOKED'
  ) {
    super(message)
    this.name = 'AuthError'
  }
}

function getAccessSecret(): Uint8Array {
  const secret = process.env['JWT_ACCESS_SECRET'] ?? ''
  if (secret.length < 32) {
    throw new Error('JWT_ACCESS_SECRET must be at least 32 characters')
  }
  return new TextEncoder().encode(secret)
}

function getRefreshSecret(): string {
  const secret = process.env['JWT_REFRESH_SECRET'] ?? ''
  if (secret.length < 32) {
    throw new Error('JWT_REFRESH_SECRET must be at least 32 characters')
  }
  return secret
}

function hashRefreshToken(token: string): string {
  return crypto.createHmac('sha256', getRefreshSecret()).update(token).digest('hex')
}

function generateRefreshToken(): string {
  return crypto.randomBytes(32).toString('base64url')
}

/**
 * Issues a new access + refresh token pair for a user.
 */
export async function issueTokenPair(userId: string): Promise<TokenPair> {
  const accessToken = await new SignJWT({ sub: userId, type: 'access' })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${ACCESS_TTL_SECONDS}s`)
    .sign(getAccessSecret())

  const refreshToken = generateRefreshToken()
  const familyId = crypto.randomUUID()
  const expiresAt = new Date(Date.now() + REFRESH_TTL_SECONDS * 1000)

  await insertSession({
    userId,
    refreshTokenHash: hashRefreshToken(refreshToken),
    familyId,
    expiresAt,
  })

  return { accessToken, refreshToken, userId }
}

/**
 * Verifies an access JWT and returns the user ID.
 */
export async function verifyAccessToken(token: string): Promise<{ userId: string }> {
  try {
    const { payload } = await jwtVerify(token, getAccessSecret())
    const sub = payload.sub
    if (!sub || typeof sub !== 'string') {
      throw new AuthError('Invalid token', 'INVALID_TOKEN')
    }
    if (payload['type'] !== 'access') {
      throw new AuthError('Invalid token type', 'INVALID_TOKEN')
    }
    return { userId: sub }
  } catch (err) {
    if (err instanceof AuthError) throw err
    throw new AuthError('Invalid or expired token', 'EXPIRED')
  }
}

/**
 * Rotates refresh token — revokes old, issues new in same family.
 */
export async function refreshSession(refreshToken: string): Promise<TokenPair> {
  const hash = hashRefreshToken(refreshToken)
  const active = await findActiveSessionByHash(hash)

  if (active) {
    if (active.expiresAt.getTime() < Date.now()) {
      await revokeSessionById(active.id)
      throw new AuthError('Refresh token expired', 'EXPIRED')
    }

    await revokeSessionById(active.id)

    const newRefreshToken = generateRefreshToken()
    const expiresAt = new Date(Date.now() + REFRESH_TTL_SECONDS * 1000)

    await insertSession({
      userId: active.userId,
      refreshTokenHash: hashRefreshToken(newRefreshToken),
      familyId: active.familyId,
      expiresAt,
    })

    const accessToken = await new SignJWT({ sub: active.userId, type: 'access' })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime(`${ACCESS_TTL_SECONDS}s`)
      .sign(getAccessSecret())

    return { accessToken, refreshToken: newRefreshToken, userId: active.userId }
  }

  // Reuse detection — revoked token presented again
  const revoked = await findSessionByHash(hash)
  if (revoked?.revokedAt) {
    await revokeFamily(revoked.familyId)
    throw new AuthError('Refresh token reuse detected', 'REUSE_DETECTED')
  }

  throw new AuthError('Invalid refresh token', 'INVALID_TOKEN')
}

/**
 * Revokes a single refresh session (logout).
 */
export async function revokeSession(refreshToken: string): Promise<void> {
  const hash = hashRefreshToken(refreshToken)
  const session = await findActiveSessionByHash(hash)
  if (session) {
    await revokeSessionById(session.id)
  }
}

/**
 * Revokes all sessions for a user.
 */
export async function logoutAllSessions(userId: string): Promise<void> {
  await revokeAllUserSessions(userId)
}
