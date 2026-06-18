/**
 * Owner registration — OTP verification, user creation, vehicle + tag activation.
 * Existing owners can register additional vehicles on the same mobile number.
 */

import { hashPhone, toE164Indian } from '../lib/phone'
import { isOtpDevMode } from '../types/env'
import { verifyOtp } from './otp.service'
import { createVehicle } from './vehicle.service'
import { issueTokenPair } from './auth.service'
import {
  createDevSession,
  createDevUserId,
  createDevVehicle,
} from './dev-registration'
import {
  addDevVehicle,
  findDevUserIdByPhone,
  linkDevPhone,
  setDevProfile,
} from './dev-store'
import {
  createUser,
  findUserByPhoneHash,
} from '../repositories/users.repository'
import { activateTag as activateTagInDb } from '../repositories/tags.repository'
import { getDb } from '../lib/db'
import type { RegisterVehicleInput, Vehicle } from '@parksafe/types'
import { trackServer, hashDistinctId } from '../lib/analytics'

interface RegistrationResult {
  success: boolean
  accessToken?: string
  refreshToken?: string
  userId?: string
  vehicle?: Vehicle
  error?: string
  statusCode?: number
}

async function resolveOwnerUser(
  ownerName: string,
  ownerPhoneE164: string
): Promise<{ id: string }> {
  if (isOtpDevMode && !getDb()) {
    const existingUserId = findDevUserIdByPhone(ownerPhoneE164)
    if (existingUserId) {
      return { id: existingUserId }
    }

    const userId = createDevUserId()
    setDevProfile(userId, ownerName)
    linkDevPhone(ownerPhoneE164, userId)
    return { id: userId }
  }

  const existing = await findUserByPhoneHash(hashPhone(ownerPhoneE164))
  if (existing) {
    return { id: existing.id }
  }

  const user = await createUser({
    displayName: ownerName,
    phoneE164: ownerPhoneE164,
  })
  return { id: user.id }
}

async function completeRegistration(
  userId: string,
  input: RegisterVehicleInput
): Promise<RegistrationResult> {
  const vehicleResult = await createVehicle(userId, {
    make: input.make,
    model: input.model,
    colour: input.colour,
    plate: input.plate,
  })

  if (!vehicleResult.success || !vehicleResult.vehicle) {
    return {
      success: false,
      error: vehicleResult.error ?? 'Failed to register vehicle',
    }
  }

  if (input.tagCode) {
    const activated = await activateTagInDb(
      input.tagCode,
      userId,
      vehicleResult.vehicle.id,
      input.whatsappEnabled
    )
    if (!activated) {
      console.warn('[registration] Tag activation failed for code:', input.tagCode)
    } else {
      trackServer(userId, { event: 'tag_activated', properties: {} })
    }
  }

  const tokens = isOtpDevMode
    ? createDevSession(userId)
    : await issueTokenPair(userId)

  trackServer(userId, {
    event: 'registration_completed',
    properties: { tagLinked: Boolean(input.tagCode) },
  })
  trackServer(userId, { event: 'otp_verified', properties: { flow: 'register' } })

  return {
    success: true,
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken,
    userId,
    vehicle: vehicleResult.vehicle,
  }
}

/**
 * Completes owner registration after OTP verification.
 */
export async function registerVehicle(
  input: RegisterVehicleInput
): Promise<RegistrationResult> {
  const ownerPhoneE164 = toE164Indian(input.ownerPhone)

  const otpResult = await verifyOtp(ownerPhoneE164, input.otp)
  if (!otpResult.valid) {
    trackServer(hashDistinctId(ownerPhoneE164), {
      event: 'otp_failed',
      properties: { flow: 'register' },
    })
    return { success: false, error: otpResult.message }
  }

  if (isOtpDevMode && !getDb()) {
    const user = await resolveOwnerUser(input.ownerName, ownerPhoneE164)
    const vehicle = createDevVehicle(user.id, {
      make: input.make,
      model: input.model,
      colour: input.colour,
      plate: input.plate,
    })
    addDevVehicle(
      user.id,
      {
        make: input.make,
        model: input.model,
        colour: input.colour,
        plate: input.plate,
      },
      vehicle
    )

    const { accessToken, refreshToken } = createDevSession(user.id)
    trackServer(user.id, {
      event: 'registration_completed',
      properties: { tagLinked: Boolean(input.tagCode) },
    })
    trackServer(user.id, { event: 'otp_verified', properties: { flow: 'register' } })
    return {
      success: true,
      accessToken,
      refreshToken,
      userId: user.id,
      vehicle,
    }
  }

  try {
    const user = await resolveOwnerUser(input.ownerName, ownerPhoneE164)
    return await completeRegistration(user.id, input)
  } catch (err) {
    console.error('[registration] Failed:', err instanceof Error ? err.message : err)
    return { success: false, error: 'Registration failed. Please try again.' }
  }
}
