/**
 * Tag lifecycle management — public lookups return masked data only.
 */

import type { TagInfo, UpdateTagInput } from '@parksafe/types'
import {
  findTagByCode,
  updateTagPreferences,
} from '../repositories/tags.repository'

interface TagLookupResult {
  found: boolean
  tag?: TagInfo
  error?: string
}

/**
 * Looks up a tag by its public tag code (from the QR URL).
 */
export async function getTagByCode(tagCode: string): Promise<TagLookupResult> {
  const row = await findTagByCode(tagCode)

  if (!row) {
    return { found: false }
  }

  const availableChannels: Array<'SMS' | 'WHATSAPP' | 'CALL'> = []
  if (row.notifySms) availableChannels.push('SMS')
  if (row.notifyWhatsapp) availableChannels.push('WHATSAPP')
  if (row.callEnabled) availableChannels.push('CALL')

  return {
    found: true,
    tag: {
      tagId: row.id,
      status: row.status,
      vehicle: {
        make: row.vehicleMake ?? '',
        model: row.vehicleModel ?? '',
        colour: row.vehicleColour ?? '',
        platePartial: row.vehiclePlatePartial ?? '',
      },
      availableChannels,
    },
  }
}

/**
 * Updates tag notification preferences for the authenticated owner.
 */
export async function updateTag(
  tagId: string,
  ownerId: string,
  updates: UpdateTagInput
): Promise<{ success: boolean; error?: string }> {
  const ok = await updateTagPreferences(tagId, ownerId, {
    ...(updates.notifySms !== undefined ? { notifySms: updates.notifySms } : {}),
    ...(updates.notifyWhatsapp !== undefined ? { notifyWhatsapp: updates.notifyWhatsapp } : {}),
    ...(updates.callEnabled !== undefined ? { callEnabled: updates.callEnabled } : {}),
    ...(updates.status !== undefined ? { status: updates.status } : {}),
  })

  if (!ok) {
    return { success: false, error: 'Failed to update tag' }
  }
  return { success: true }
}
