/**
 * apps/api/src/services/otp.service.ts
 * OTP business rules: 6-digit, 5-min TTL, 3 max attempts, 15-min lockout.
 * Primary store: Redis (Upstash). No raw phone number is ever stored.
 * Uses HMAC of phone number as the Redis key — allows rate limiting without PII.
 */

import crypto from 'node:crypto'
import { redis } from '../lib/redis'
import { isOtpDevMode } from '../types/env'
import { whatsappService } from './whatsapp/whatsapp.service'

const OTP_TTL_SECONDS = 300 // 5 minutes
const MAX_ATTEMPTS = 3
const LOCKOUT_SECONDS = 900 // 15 minutes

/**
 * Generates an HMAC of the phone number.
 * Enables consistent Redis key derivation without storing the raw number.
 */
function hashPhone(phone: string): string {
  return crypto
    .createHmac('sha256', process.env['OTP_HMAC_SECRET'] ?? '')
    .update(phone)
    .digest('hex')
}

/**
 * Generates a cryptographically random 6-digit OTP.
 * Uses crypto.randomInt for uniform distribution — no modulo bias.
 */
function generateOtp(): string {
  return String(crypto.randomInt(100000, 999999))
}

interface OtpRequestResult {
  success: boolean
  message: string
  /** Present in OTP dev mode only — for local E2E and manual testing. */
  devOtp?: string
}

interface OtpVerifyResult {
  valid: boolean
  message: string
}

/**
 * Initiates an OTP request for a given phone number.
 * Checks for active lockout, generates OTP, stores in Redis, dispatches WhatsApp OTP.
 * @param phone - E.164 formatted Indian mobile number
 */
export async function requestOtp(phone: string): Promise<OtpRequestResult> {
  const hash = hashPhone(phone)
  const lockKey = `otp:lock:${hash}`
  const locked = await redis.get(lockKey)

  if (locked !== null) {
    const ttl = await redis.ttl(lockKey)
    return {
      success: false,
      message: `Account locked. Try again in ${Math.ceil(ttl / 60)} minutes.`,
    }
  }

  const otp = generateOtp()
  const otpKey = `otp:code:${hash}`
  const attemptKey = `otp:attempts:${hash}`

  // Store OTP with TTL — the raw phone number is only passed to the WhatsApp adapter
  await redis.setex(otpKey, OTP_TTL_SECONDS, otp)
  await redis.del(attemptKey) // Reset attempt counter on fresh OTP request

  if (isOtpDevMode) {
    // Local dev — log OTP keyed by phone hash only; never log raw phone numbers
    const hashPrefix = hash.slice(0, 8)
    console.log(`[otp.dev] OTP for hash ${hashPrefix}…: ${otp}`)
    return { success: true, message: 'OTP sent', devOtp: otp }
  }

  const result = await whatsappService.sendOtp(phone, otp)
  if (!result.success) {
    throw new Error(result.error ?? 'Failed to send OTP via WhatsApp')
  }

  return { success: true, message: 'OTP sent' }
}

/**
 * Verifies an OTP for a given phone number.
 * Tracks failed attempts and enforces lockout after MAX_ATTEMPTS failures.
 * @param phone - E.164 formatted Indian mobile number
 * @param otp - 6-digit OTP entered by the user
 */
export async function verifyOtp(phone: string, otp: string): Promise<OtpVerifyResult> {
  const hash = hashPhone(phone)
  const otpKey = `otp:code:${hash}`
  const attemptKey = `otp:attempts:${hash}`
  const lockKey = `otp:lock:${hash}`

  const storedOtp = await redis.get<string>(otpKey)

  if (storedOtp === null) {
    return { valid: false, message: 'OTP expired or not requested.' }
  }

  const attempts = await redis.incr(attemptKey)

  if (storedOtp !== otp) {
    if (attempts >= MAX_ATTEMPTS) {
      // Lock account and invalidate OTP to prevent brute-force
      await redis.setex(lockKey, LOCKOUT_SECONDS, '1')
      await redis.del(otpKey)
      return { valid: false, message: 'Too many attempts. Account locked for 15 minutes.' }
    }
    return {
      valid: false,
      message: `Incorrect OTP. ${MAX_ATTEMPTS - attempts} attempt${MAX_ATTEMPTS - attempts === 1 ? '' : 's'} remaining.`,
    }
  }

  // Valid — clean up all OTP keys
  await Promise.all([redis.del(otpKey), redis.del(attemptKey)])

  return { valid: true, message: 'OTP verified.' }
}
