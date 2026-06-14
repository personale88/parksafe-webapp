/**
 * apps/api/src/services/relay.service.ts
 * Abstracts communication channels behind a single interface.
 * WhatsApp → whatsappService (AiSensy/Meta templates). Call → Exotel.
 */

import { IssueType, ChannelType } from '@parksafe/types'
import { exotelAdapter } from '../lib/adapters/exotel'
import { whatsappService } from './whatsapp/whatsapp.service'

interface RelayOptions {
  /** Owner phone in E.164 format — passed only here, never returned to client */
  ownerPhone: string
  issueType: IssueType
  channel: ChannelType
  /** Pre-filtered custom note from the reporter */
  customNote?: string
}

interface RelayResult {
  success: boolean
  providerMessageId?: string
  error?: string
}

/**
 * Dispatches a relay message to the vehicle owner via the specified channel.
 * @param opts - Relay options including owner phone (never logged)
 */
export async function dispatchRelay(opts: RelayOptions): Promise<RelayResult> {
  switch (opts.channel) {
    case ChannelType.WHATSAPP:
      return whatsappService.sendContactAlert({
        phone: opts.ownerPhone,
        issueType: opts.issueType,
        ...(opts.customNote !== undefined ? { customNote: opts.customNote } : {}),
      })

    case ChannelType.CALL:
      return exotelAdapter.initiateCall({ to: opts.ownerPhone, issueType: opts.issueType })

    default: {
      const _exhaustive: never = opts.channel
      throw new Error(`Unsupported channel: ${String(_exhaustive)}`)
    }
  }
}
