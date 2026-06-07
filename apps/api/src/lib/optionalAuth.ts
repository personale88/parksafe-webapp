import { verifyAccessToken } from '../services/auth.service'
import { isOtpDevMode } from '../types/env'
import { parseDevSessionToken } from '../services/dev-registration'

/**
 * Resolves user ID from an optional Bearer token — returns null if absent or invalid.
 */
export async function getOptionalUserId(authHeader: string | undefined): Promise<string | null> {
  if (!authHeader?.startsWith('Bearer ')) return null

  const token = authHeader.slice(7)

  if (isOtpDevMode) {
    const devUserId = parseDevSessionToken(token)
    if (devUserId) return devUserId
  }

  try {
    const { userId } = await verifyAccessToken(token)
    return userId
  } catch {
    return null
  }
}
