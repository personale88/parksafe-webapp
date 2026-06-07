import { createMiddleware } from 'hono/factory'
import { verifyAccessToken } from '../services/auth.service'
import { isOtpDevMode } from '../types/env'
import { parseDevSessionToken } from '../services/dev-registration'

/**
 * JWT auth middleware — validates Bearer access token.
 * In OTP dev mode, accepts locally issued dev-session tokens.
 */
export const authMiddleware = createMiddleware<{
  Variables: { userId: string }
}>(async (c, next) => {
  const authHeader = c.req.header('Authorization')

  if (!authHeader?.startsWith('Bearer ')) {
    return c.json({ error: 'Missing or malformed authorization header' }, 401)
  }

  const token = authHeader.slice(7)

  if (isOtpDevMode) {
    const devUserId = parseDevSessionToken(token)
    if (devUserId) {
      c.set('userId', devUserId)
      await next()
      return
    }
  }

  try {
    const { userId } = await verifyAccessToken(token)
    c.set('userId', userId)
    await next()
  } catch {
    return c.json({ error: 'Invalid or expired session' }, 401)
  }
})
