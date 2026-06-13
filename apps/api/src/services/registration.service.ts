/**
 * Owner registration — OTP verification, user creation, vehicle + tag activation.
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
import { addDevVehicle, linkDevPhone, setDevProfile } from './dev-store'
import {
  createUser,
  UserAlreadyExistsError,
} from '../repositories/users.repository'
import { activateTag as activateTagInDb } from '../repositories/tags.repository'
import { getDb } from '../lib/db'
import type { RegisterVehicleInput, Vehicle } from '@parksafe/types'

interface RegistrationResult {
  success: boolean
  accessToken?: string
  refreshToken?: string
  userId?: string
  vehicle?: Vehicle
  error?: string
  statusCode?: number
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
    return { success: false, error: otpResult.message }
  }

  if (isOtpDevMode && !getDb()) {
    const userId = createDevUserId()
    const { accessToken, refreshToken } = createDevSession(userId)
    const vehicle = createDevVehicle(userId, {
      make: input.make,
      model: input.model,
      colour: input.colour,
      plate: input.plate,
    })
    setDevProfile(userId, input.ownerName)
    linkDevPhone(ownerPhoneE164, userId)
    addDevVehicle(
      userId,
      {
        make: input.make,
        model: input.model,
        colour: input.colour,
        plate: input.plate,
      },
      vehicle
    )

    return {
      success: true,
      accessToken,
      refreshToken,
      userId,
      vehicle,
    }
  }

  try {
    const user = await createUser({
      displayName: input.ownerName,
      phoneE164: ownerPhoneE164,
    })

    const vehicleResult = await createVehicle(user.id, {
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
        user.id,
        vehicleResult.vehicle.id,
        input.whatsappEnabled
      )
      if (!activated) {
        console.warn('[registration] Tag activation failed for code:', input.tagCode)
      }
    }

    const tokens = isOtpDevMode
      ? createDevSession(user.id)
      : await issueTokenPair(user.id)

    return {
      success: true,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      userId: user.id,
      vehicle: vehicleResult.vehicle,
    }
  } catch (err) {
    if (err instanceof UserAlreadyExistsError) {
      return {
        success: false,
        error: 'This mobile number is already registered. Please sign in instead.',
        statusCode: 409,
      }
    }
    console.error('[registration] Failed:', err instanceof Error ? err.message : err)
    return { success: false, error: 'Registration failed. Please try again.' }
  }
}
