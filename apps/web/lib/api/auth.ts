import { apiFetch, rawApiFetch } from './client'
import type { RequestOtpInput, VerifyOtpInput } from '@parksafe/types'

interface RequestOtpResponse {
  message: string
}

interface VerifyOtpResponse {
  message: string
  verified: boolean
}

interface TokenResponse {
  accessToken: string
  refreshToken: string
  userId: string
}

/**
 * Requests an OTP for the given phone number.
 */
export async function requestOtp(input: RequestOtpInput): Promise<RequestOtpResponse> {
  return apiFetch<RequestOtpResponse>('/auth/request-otp', {
    method: 'POST',
    body: input as Record<string, unknown>,
  })
}

/**
 * Verifies the OTP entered by the user.
 */
export async function verifyOtp(input: VerifyOtpInput): Promise<VerifyOtpResponse> {
  return apiFetch<VerifyOtpResponse>('/auth/verify-otp', {
    method: 'POST',
    body: input as Record<string, unknown>,
  })
}

/**
 * Signs in an existing owner after OTP verification.
 */
export async function signIn(input: VerifyOtpInput): Promise<TokenResponse> {
  return apiFetch<TokenResponse>('/auth/sign-in', {
    method: 'POST',
    body: input as Record<string, unknown>,
  })
}

/** Returns whether the phone number belongs to a registered ParkSafe owner. */
export async function checkSignInPhone(
  input: RequestOtpInput
): Promise<{ registered: boolean }> {
  return apiFetch<{ registered: boolean }>('/auth/sign-in/check', {
    method: 'POST',
    body: input as Record<string, unknown>,
  })
}

/**
 * Rotates refresh token and returns a new access + refresh pair.
 * Uses rawApiFetch to avoid infinite refresh loops.
 */
export async function refreshSession(refreshToken: string): Promise<TokenResponse> {
  return rawApiFetch<TokenResponse>('/auth/refresh', {
    method: 'POST',
    body: { refreshToken },
  })
}

/** Revokes the current refresh session server-side. */
export async function logout(refreshToken: string): Promise<void> {
  await rawApiFetch<{ success: boolean }>('/auth/logout', {
    method: 'POST',
    body: { refreshToken },
  })
}

export const SIGN_IN_NOT_REGISTERED_CODE = 'NOT_REGISTERED'
