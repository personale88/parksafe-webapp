import type { TagInfo } from '@parksafe/types'

/** Seed tag from packages/db — use in local dev when API is available. */
export const DEV_CONTACT_TAG_ID = 'test-tag-uuid-001'

/** Figma-aligned mock vehicle for UI preview when the API is unreachable. */
export const DEV_CONTACT_PREVIEW: {
  tagId: string
  vehicle: TagInfo['vehicle']
  availableChannels: TagInfo['availableChannels']
} = {
  tagId: DEV_CONTACT_TAG_ID,
  vehicle: {
    make: 'Toyota',
    model: 'Camry',
    colour: 'Silver',
    platePartial: 'ABC 1234',
  },
  availableChannels: ['WHATSAPP', 'CALL'],
}

/** Local-only bypass for tag lookup — never enabled in production builds. */
export function isContactDevPreview(): boolean {
  return process.env.NODE_ENV === 'development'
}
