import { describe, it, expect, vi, beforeEach } from 'vitest'
import { AuthError } from '../../src/services/auth.service'

process.env['JWT_ACCESS_SECRET'] = 'test-jwt-access-secret-32chars-minimum'
process.env['JWT_REFRESH_SECRET'] = 'test-jwt-refresh-secret-32chars-minimum'

const mockInsert = vi.fn()
const mockFindActive = vi.fn()
const mockFindAny = vi.fn()
const mockRevokeById = vi.fn()
const mockRevokeFamily = vi.fn()

vi.mock('../../src/repositories/sessions.repository', () => ({
  insertSession: (...args: unknown[]) => mockInsert(...args),
  findActiveSessionByHash: (...args: unknown[]) => mockFindActive(...args),
  findSessionByHash: (...args: unknown[]) => mockFindAny(...args),
  revokeSessionById: (...args: unknown[]) => mockRevokeById(...args),
  revokeFamily: (...args: unknown[]) => mockRevokeFamily(...args),
  revokeAllUserSessions: vi.fn(),
}))

const { issueTokenPair, refreshSession } = await import('../../src/services/auth.service')

describe('auth.refresh rotation', () => {
  const userId = '00000000-0000-0000-0000-000000000099'
  const familyId = '00000000-0000-0000-0000-0000000000aa'

  beforeEach(() => {
    vi.clearAllMocks()
    mockInsert.mockResolvedValue({ id: 's1', userId, familyId })
  })

  it('rotates refresh token on valid refresh', async () => {
    const pair = await issueTokenPair(userId)
    const hashPrefix = pair.refreshToken.slice(0, 8)

    mockFindActive.mockResolvedValueOnce({
      id: 'session-old',
      userId,
      refreshTokenHash: 'hash',
      familyId,
      expiresAt: new Date(Date.now() + 86400000),
      revokedAt: null,
    })

    const rotated = await refreshSession(pair.refreshToken)
    expect(rotated.accessToken).toBeTruthy()
    expect(rotated.refreshToken).not.toBe(pair.refreshToken)
    expect(mockRevokeById).toHaveBeenCalledWith('session-old')
    expect(mockInsert).toHaveBeenCalled()
    expect(hashPrefix).toBeTruthy()
  })

  it('detects refresh token reuse and revokes family', async () => {
    mockFindActive.mockResolvedValueOnce(null)
    mockFindAny.mockResolvedValueOnce({
      id: 'session-revoked',
      userId,
      refreshTokenHash: 'hash',
      familyId,
      expiresAt: new Date(Date.now() + 86400000),
      revokedAt: new Date(),
    })

    await expect(refreshSession('reused-token-value-here')).rejects.toMatchObject({
      code: 'REUSE_DETECTED',
    } satisfies Partial<AuthError>)
    expect(mockRevokeFamily).toHaveBeenCalledWith(familyId)
  })

  it('rejects expired refresh token', async () => {
    mockFindActive.mockResolvedValueOnce({
      id: 'session-expired',
      userId,
      refreshTokenHash: 'hash',
      familyId,
      expiresAt: new Date(Date.now() - 1000),
      revokedAt: null,
    })

    await expect(refreshSession('expired-token')).rejects.toMatchObject({
      code: 'EXPIRED',
    } satisfies Partial<AuthError>)
  })

  it('rejects unknown refresh token', async () => {
    mockFindActive.mockResolvedValueOnce(null)
    mockFindAny.mockResolvedValueOnce(null)

    await expect(refreshSession('unknown-token')).rejects.toMatchObject({
      code: 'INVALID_TOKEN',
    } satisfies Partial<AuthError>)
  })
})
