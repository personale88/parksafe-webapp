import { getTagInfo } from '@/lib/api/tags'
import type { TagInfo } from '@parksafe/types'
import { DEV_CONTACT_PREVIEW } from './devPreview'

export interface ResolvedContactTag {
  tagId: string
  vehicle: TagInfo['vehicle']
  availableChannels: TagInfo['availableChannels']
  status: TagInfo['status'] | 'PREVIEW'
}

export type ResolveContactResult =
  | { ok: true; data: ResolvedContactTag }
  | { ok: false; reason: 'NOT_FOUND' | 'UNREGISTERED' | 'INACTIVE' }

/**
 * Resolves tag data for contact flow pages.
 * In local dev, falls back to preview data when the API has no tag.
 */
export async function resolveContactTag(tagId: string): Promise<ResolveContactResult> {
  const tag = await getTagInfo(tagId)

  if (!tag || tag.status === 'UNREGISTERED') {
    return { ok: false, reason: 'NOT_FOUND' }
  }

  if (tag.status === 'INACTIVE') {
    return { ok: false, reason: 'INACTIVE' }
  }

  return {
    ok: true,
    data: {
      tagId,
      vehicle: tag.vehicle,
      availableChannels: tag.availableChannels,
      status: tag.status,
    },
  }
}

/** Resolved session for dev `/contact` routes (no tagId in URL). */
export function resolveDevContactPreview(): ResolvedContactTag {
  return {
    tagId: DEV_CONTACT_PREVIEW.tagId,
    vehicle: DEV_CONTACT_PREVIEW.vehicle,
    availableChannels: DEV_CONTACT_PREVIEW.availableChannels,
    status: 'PREVIEW',
  }
}
