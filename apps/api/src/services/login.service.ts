/**
 * Owner sign-in — OTP verification and custom JWT session issuance.
 */

import { hashPhone } from '../lib/phone'
import { isOtpDevMode } from '../types/env'
import { verifyOtp } from './otp.service'
import { issueTokenPair } from './auth.service'
import { findUserByPhoneHash } from '../repositories/users.repository'
import { createDevSession } from './dev-registration'
import { findDevUserIdByPhone } from './dev-store'
import { trackServer, hashDistinctId } from '../lib/analytics'

export const SIGN_IN_ERROR_NOT_REGISTERED = 'NOT_REGISTERED' as const

const NOT_REGISTERED_MESSAGE =
  'This mobile number is not registered with ParkSafe. Register your vehicle to continue.'

async function resolveRegisteredUserId(phoneE164: string): Promise<string | null> {
  if (isOtpDevMode) {
    const devUserId = findDevUserIdByPhone(phoneE164)
    if (devUserId) return devUserId
  }
  const user = await findUserByPhoneHash(hashPhone(phoneE164))
  return user?.id ?? null
}

/** Whether an owner account exists for this phone (before sending sign-in OTP). */
export async function isPhoneRegistered(phoneE164: string): Promise<boolean> {
  return (await resolveRegisteredUserId(phoneE164)) !== null
}

interface SignInResult {
  success: boolean
  accessToken?: string
  refreshToken?: string
  userId?: string
  error?: string
  code?: string
}

export async function signInWithOtp(phoneE164: string, otp: string): Promise<SignInResult> {
  const otpResult = await verifyOtp(phoneE164, otp)
  if (!otpResult.valid) {
    trackServer(hashDistinctId(phoneE164), {
      event: 'otp_failed',
      properties: { flow: 'sign_in' },
    })
    return { success: false, error: otpResult.message }
  }

  if (isOtpDevMode) {
    const userId = await resolveRegisteredUserId(phoneE164)
    if (!userId) {
      return {
        success: false,
        error: NOT_REGISTERED_MESSAGE,
        code: SIGN_IN_ERROR_NOT_REGISTERED,
      }
    }
    const { accessToken, refreshToken } = createDevSession(userId)
    trackServer(userId, { event: 'otp_verified', properties: { flow: 'sign_in' } })
    trackServer(userId, { event: 'sign_in_completed', properties: {} })
    return { success: true, accessToken, refreshToken, userId }
  }

  const user = await findUserByPhoneHash(hashPhone(phoneE164))
  if (!user) {
    return {
      success: false,
      error: NOT_REGISTERED_MESSAGE,
      code: SIGN_IN_ERROR_NOT_REGISTERED,
    }
  }

  const tokens = await issueTokenPair(user.id)
  trackServer(user.id, { event: 'otp_verified', properties: { flow: 'sign_in' } })
  trackServer(user.id, { event: 'sign_in_completed', properties: {} })
  return {
    success: true,
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken,
    userId: tokens.userId,
  }
}
