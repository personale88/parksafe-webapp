import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../../src/repositories/sessions.repository', () => ({
  insertSession: vi.fn().mockResolvedValue({
    id: 'session-1',
    userId: 'user-1',
    refreshTokenHash: 'hash',
    familyId: 'family-1',
    expiresAt: new Date(Date.now() + 86400000),
    revokedAt: null,
  }),
  findActiveSessionByHash: vi.fn(),
  findSessionByHash: vi.fn(),
  revokeSessionById: vi.fn(),
  revokeFamily: vi.fn(),
  revokeAllUserSessions: vi.fn(),
}))

process.env['JWT_ACCESS_SECRET'] = 'test-jwt-access-secret-32chars-minimum'
process.env['JWT_REFRESH_SECRET'] = 'test-jwt-refresh-secret-32chars-minimum'

const { issueTokenPair, verifyAccessToken } = await import('../../src/services/auth.service')

describe('auth.service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('issues access and refresh tokens', async () => {
    const pair = await issueTokenPair('00000000-0000-0000-0000-000000000001')
    expect(pair.accessToken).toBeTruthy()
    expect(pair.refreshToken).toBeTruthy()
    expect(pair.userId).toBe('00000000-0000-0000-0000-000000000001')
  })

  it('verifies a valid access token', async () => {
    const pair = await issueTokenPair('00000000-0000-0000-0000-000000000002')
    const result = await verifyAccessToken(pair.accessToken)
    expect(result.userId).toBe('00000000-0000-0000-0000-000000000002')
  })

  it('rejects an invalid access token', async () => {
    await expect(verifyAccessToken('invalid.token.here')).rejects.toThrow()
  })
})
