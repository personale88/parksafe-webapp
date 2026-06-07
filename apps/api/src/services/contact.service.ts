/**
 * Contact relay — owner phone resolved server-side only, never returned to client.
 */

import crypto from 'node:crypto'
import type { ChannelType, IssueType } from '@parksafe/types'
import { getTagByCode } from './tag.service'
import { dispatchRelay } from './relay.service'
import { auditContactEvent } from './audit.service'
import { filterNote } from './profanity.service'
import { isOtpDevMode } from '../types/env'
import { incrementDevReports } from './dev-store'
import { decryptOwnerPhone } from '../repositories/users.repository'
import { findTagByCode } from '../repositories/tags.repository'

interface ContactRequestInput {
  tagId: string
  issueType: IssueType
  channel: ChannelType
  customNote?: string | undefined
  sessionId: string
  reporterUserId?: string | undefined
}

interface ContactRequestResult {
  success: boolean
  messageId?: string
  error?: string
  status: number
}

/**
 * Resolves owner phone for relay dispatch by owner user ID.
 */
export async function resolveOwnerPhone(ownerId: string): Promise<string | null> {
  return decryptOwnerPhone(ownerId)
}

export async function processContactRequest(
  input: ContactRequestInput
): Promise<ContactRequestResult> {
  const { tagId, issueType, channel, customNote, sessionId, reporterUserId } = input

  const tagResult = await getTagByCode(tagId)

  if (!tagResult.found || !tagResult.tag) {
    return { success: false, error: 'Tag not found', status: 404 }
  }

  if (tagResult.tag.status !== 'ACTIVE') {
    return { success: false, error: 'Tag is not active', status: 400 }
  }

  if (!tagResult.tag.availableChannels.includes(channel)) {
    return {
      success: false,
      error: `Channel ${channel} is not enabled for this tag`,
      status: 400,
    }
  }

  const tagRow = await findTagByCode(tagId)
  const ownerId = tagRow?.ownerId
  if (!ownerId) {
    return { success: false, error: 'Unable to reach vehicle owner at this time', status: 503 }
  }

  const ownerPhone = await resolveOwnerPhone(ownerId)
  if (!ownerPhone) {
    return {
      success: false,
      error: 'Unable to reach vehicle owner at this time',
      status: 503,
    }
  }

  const filteredNote = filterNote(customNote)

  const relayResult = await dispatchRelay({
    ownerPhone,
    issueType,
    channel,
    ...(filteredNote !== undefined ? { customNote: filteredNote } : {}),
  })

  if (isOtpDevMode && reporterUserId) {
    incrementDevReports(reporterUserId)
  }

  void auditContactEvent({
    tagId: tagResult.tag.tagId,
    reporterSessionId: sessionId,
    issueType,
    channel,
    relaySuccess: relayResult.success,
    ...(tagRow?.vehicleId ? { vehicleId: tagRow.vehicleId } : {}),
    ...(reporterUserId !== undefined ? { reporterUserId } : {}),
    ...(filteredNote !== undefined ? { customNote: filteredNote } : {}),
  })

  if (!relayResult.success) {
    return {
      success: false,
      error: 'Failed to deliver message. Please try again.',
      status: 503,
    }
  }

  return {
    success: true,
    messageId: relayResult.providerMessageId ?? crypto.randomUUID(),
    status: 200,
  }
}
