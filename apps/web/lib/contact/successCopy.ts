import { ChannelType } from '@parksafe/types'
import { en } from '@/content/en'

/** Channel-specific success subtitle matching Figma copy. */
export function getSuccessBodyForChannel(channel: ChannelType): string {
  switch (channel) {
    case ChannelType.WHATSAPP:
      return en.CONTACT_SUCCESS_BODY_WHATSAPP
    case ChannelType.CALL:
      return en.CONTACT_SUCCESS_BODY_CALL
    default:
      return en.CONTACT_SUCCESS_BODY_WHATSAPP
  }
}

/** Formats relay time for the issue-reported card (e.g. "6:57 AM"). */
export function formatSentTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })
}
