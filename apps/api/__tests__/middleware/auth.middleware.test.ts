import { describe, it, expect, vi } from 'vitest'
import { Hono } from 'hono'
import { authMiddleware } from '../../src/middleware/auth.middleware'

vi.mock('../../src/types/env', () => ({
  isOtpDevMode: true,
}))

vi.mock('../../src/services/auth.service', () => ({
  verifyAccessToken: vi.fn().mockRejectedValue(new Error('invalid')),
}))

describe('auth.middleware', () => {
  const app = new Hono()
  app.use('*', authMiddleware)
  app.get('/protected', c => c.json({ userId: c.get('userId') }))

  it('returns 401 without authorization header', async () => {
    const res = await app.request('/protected')
    expect(res.status).toBe(401)
  })

  it('accepts dev-session token in dev mode', async () => {
    const devUserId = '00000000-0000-0000-0000-000000000010'
    const res = await app.request('/protected', {
      headers: { Authorization: `Bearer dev-session:${devUserId}` },
    })
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.userId).toBe(devUserId)
  })
})
