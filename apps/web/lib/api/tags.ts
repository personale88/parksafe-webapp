import { apiFetch } from './client'
import type { TagInfo } from '@parksafe/types'

/**
 * Fetches public tag info for the reporter contact flow.
 * Returns ONLY masked vehicle data — owner identity never included.
 * Returns null on 404 (unregistered tag) instead of throwing.
 * @param tagId - Tag UUID from the QR code URL
 */
export async function getTagInfo(tagId: string): Promise<TagInfo | null> {
  try {
    return await apiFetch<TagInfo>(`/tags/${tagId}`)
  } catch {
    return null
  }
}

/**
 * Updates notification preferences for a tag owned by the authenticated user.
 * @param tagId - UUID of the tag to update
 * @param updates - Partial preference updates
 * @param token - Supabase JWT for auth header
 */
export async function updateTagPreferences(
  tagId: string,
  updates: { notifyWhatsapp?: boolean; callEnabled?: boolean },
  token: string
): Promise<void> {
  await apiFetch(`/tags/${tagId}`, {
    method: 'PATCH',
    body: updates as Record<string, unknown>,
    headers: { Authorization: `Bearer ${token}` },
  })
}
