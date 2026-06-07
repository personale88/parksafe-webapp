import { describe, it, expect, vi } from 'vitest'
import app from '../../src/index'

vi.mock('../../src/services/otp.service', () => ({
  requestOtp: vi.fn().mockResolvedValue({ success: true, message: 'OTP sent' }),
  verifyOtp: vi.fn().mockResolvedValue({ valid: true, message: 'OTP verified.' }),
}))

vi.mock('../../src/services/login.service', () => ({
  isPhoneRegistered: vi.fn().mockResolvedValue(true),
  signInWithOtp: vi.fn().mockResolvedValue({
    success: true,
    accessToken: 'access',
    refreshToken: 'refresh',
    userId: 'user-1',
  }),
  SIGN_IN_ERROR_NOT_REGISTERED: 'NOT_REGISTERED',
}))

vi.mock('../../src/services/auth.service', () => ({
  refreshSession: vi.fn().mockResolvedValue({
    accessToken: 'new-access',
    refreshToken: 'new-refresh',
    userId: 'user-1',
  }),
  revokeSession: vi.fn().mockResolvedValue(undefined),
  AuthError: class AuthError extends Error {},
}))

describe('auth routes', () => {
  it('POST /auth/request-otp returns 200', async () => {
    const res = await app.request('/auth/request-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: '+919876543210' }),
    })
    expect(res.status).toBe(200)
  })

  it('POST /auth/sign-in returns tokens', async () => {
    const res = await app.request('/auth/sign-in', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: '+919876543210', otp: '123456' }),
    })
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.accessToken).toBe('access')
    expect(body.refreshToken).toBe('refresh')
  })

  it('POST /auth/refresh returns new tokens', async () => {
    const res = await app.request('/auth/refresh', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken: 'old-refresh' }),
    })
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.accessToken).toBe('new-access')
  })

  it('POST /auth/logout returns success', async () => {
    const res = await app.request('/auth/logout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken: 'token' }),
    })
    expect(res.status).toBe(200)
  })
})
