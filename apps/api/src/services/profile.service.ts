/**
 * Owner profile and account-level settings.
 */

import { isOtpDevMode } from '../types/env'
import type { UpdateProfileInput, UpdateSettingsInput, UserProfile, UserSettings } from '@parksafe/types'
import { getDevProfile, getDevSettings, updateDevProfile, updateDevSettings } from './dev-store'
import { findUserById, updateUser } from '../repositories/users.repository'
import { getSettings, upsertSettings } from '../repositories/userSettings.repository'

const DEFAULT_SETTINGS: UserSettings = {
  notifyWhatsapp: true,
  marketingEmails: false,
}

export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  if (isOtpDevMode) {
    const profile = getDevProfile(userId)
    return {
      id: userId,
      displayName: profile?.displayName ?? 'Driver',
      email: profile?.email ?? null,
    }
  }

  const user = await findUserById(userId)
  if (!user) return null

  return {
    id: user.id,
    displayName: user.displayName,
    email: user.email,
  }
}

export async function updateUserProfile(
  userId: string,
  input: UpdateProfileInput
): Promise<{ success: boolean; profile?: UserProfile; error?: string }> {
  if (isOtpDevMode) {
    const updated = updateDevProfile(userId, {
      ...(input.displayName !== undefined ? { displayName: input.displayName } : {}),
      ...(input.email !== undefined ? { email: input.email } : {}),
    })
    return {
      success: true,
      profile: { id: userId, displayName: updated.displayName, email: updated.email },
    }
  }

  if (input.displayName === undefined && input.email === undefined) {
    const profile = await getUserProfile(userId)
    return profile ? { success: true, profile } : { success: false, error: 'User not found' }
  }

  const updated = await updateUser(userId, {
    ...(input.displayName !== undefined ? { displayName: input.displayName } : {}),
    ...(input.email !== undefined ? { email: input.email } : {}),
  })

  if (!updated) {
    return { success: false, error: 'Failed to update profile' }
  }

  return {
    success: true,
    profile: { id: updated.id, displayName: updated.displayName, email: updated.email },
  }
}

export async function getUserSettings(userId: string): Promise<UserSettings> {
  if (isOtpDevMode) {
    return getDevSettings(userId)
  }
  return getSettings(userId)
}

export async function updateUserSettings(
  userId: string,
  input: UpdateSettingsInput
): Promise<{ success: boolean; settings?: UserSettings; error?: string }> {
  if (isOtpDevMode) {
    const existing = getDevSettings(userId)
    const merged: UserSettings = {
      notifyWhatsapp: input.notifyWhatsapp ?? existing.notifyWhatsapp,
      marketingEmails: input.marketingEmails ?? existing.marketingEmails,
    }
    return { success: true, settings: updateDevSettings(userId, merged) }
  }

  const existing = await getSettings(userId)
  const merged: UserSettings = {
    notifyWhatsapp: input.notifyWhatsapp ?? existing.notifyWhatsapp,
    marketingEmails: input.marketingEmails ?? existing.marketingEmails,
  }

  const settings = await upsertSettings(userId, merged)
  return { success: true, settings }
}

export { DEFAULT_SETTINGS }
