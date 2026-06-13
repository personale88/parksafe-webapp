import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { RequestOtpSchema, VerifyOtpSchema } from '@parksafe/types'
import { requestOtp, verifyOtp } from '../services/otp.service'
import { isPhoneRegistered, signInWithOtp, SIGN_IN_ERROR_NOT_REGISTERED } from '../services/login.service'
import { refreshSession, revokeSession, AuthError } from '../services/auth.service'

const RefreshTokenSchema = z.object({
  refreshToken: z.string().min(1),
})

export const authRoutes = new Hono()

authRoutes.post('/request-otp', zValidator('json', RequestOtpSchema), async c => {
  const { phone } = c.req.valid('json')

  try {
    const result = await requestOtp(phone)
    if (!result.success) {
      return c.json({ error: result.message }, 429)
    }
    return c.json({
      message: result.message,
      ...(result.devOtp !== undefined ? { devOtp: result.devOtp } : {}),
    })
  } catch (err) {
    console.error('[auth] request-otp failed:', err instanceof Error ? err.message : err)
    return c.json({ error: 'Failed to send OTP. Please try again.' }, 500)
  }
})

authRoutes.post('/verify-otp', zValidator('json', VerifyOtpSchema), async c => {
  const { phone, otp } = c.req.valid('json')
  const result = await verifyOtp(phone, otp)

  if (!result.valid) {
    const statusCode = result.message.includes('locked') ? 429 : 400
    return c.json({ error: result.message }, statusCode)
  }

  return c.json({ message: result.message, verified: true })
})

authRoutes.post('/sign-in/check', zValidator('json', RequestOtpSchema), async c => {
  const { phone } = c.req.valid('json')
  const registered = await isPhoneRegistered(phone)
  return c.json({ registered })
})

authRoutes.post('/sign-in', zValidator('json', VerifyOtpSchema), async c => {
  const { phone, otp } = c.req.valid('json')

  try {
    const result = await signInWithOtp(phone, otp)

    if (!result.success) {
      const statusCode = result.error?.includes('locked') ? 429 : 400
      return c.json(
        {
          error: result.error,
          ...(result.code === SIGN_IN_ERROR_NOT_REGISTERED ? { code: result.code } : {}),
        },
        statusCode
      )
    }

    return c.json({
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
      userId: result.userId,
    })
  } catch (err) {
    console.error('[auth] sign-in failed:', err instanceof Error ? err.message : err)
    return c.json({ error: 'Sign in failed. Please try again.' }, 500)
  }
})

authRoutes.post('/refresh', zValidator('json', RefreshTokenSchema), async c => {
  const { refreshToken } = c.req.valid('json')

  try {
    const tokens = await refreshSession(refreshToken)
    return c.json({
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      userId: tokens.userId,
    })
  } catch (err) {
    if (err instanceof AuthError) {
      const status = err.code === 'REUSE_DETECTED' ? 401 : 401
      return c.json({ error: err.message, code: err.code }, status)
    }
    return c.json({ error: 'Failed to refresh session' }, 500)
  }
})

authRoutes.post('/logout', zValidator('json', RefreshTokenSchema), async c => {
  const { refreshToken } = c.req.valid('json')
  await revokeSession(refreshToken)
  return c.json({ success: true })
})
