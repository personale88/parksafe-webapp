/**
 * Logs contact events — no reporter PII stored.
 */

import crypto from 'node:crypto'
import type { IssueType, ChannelType } from '@parksafe/types'
import { insertContactEvent } from '../repositories/contactEvents.repository'

interface AuditContactEventOptions {
  tagId: string
  vehicleId?: string
  reporterSessionId: string
  reporterUserId?: string
  issueType: IssueType
  channel: ChannelType
  customNote?: string
  relaySuccess: boolean
}

function hashSessionId(sessionId: string): string {
  return crypto
    .createHmac('sha256', process.env['SESSION_SIGNING_SECRET'] ?? '')
    .update(sessionId)
    .digest('hex')
}

/**
 * Records a contact event in the audit log (fire-and-forget).
 */
export async function auditContactEvent(opts: AuditContactEventOptions): Promise<void> {
  try {
    await insertContactEvent({
      tagId: opts.tagId,
      reporterSessionHash: hashSessionId(opts.reporterSessionId),
      issueType: opts.issueType,
      channel: opts.channel,
      relaySuccess: opts.relaySuccess,
      ...(opts.vehicleId !== undefined ? { vehicleId: opts.vehicleId } : {}),
      ...(opts.reporterUserId !== undefined ? { reporterUserId: opts.reporterUserId } : {}),
      ...(opts.customNote !== undefined ? { customNote: opts.customNote } : {}),
    })
  } catch (err) {
    console.error('[audit] Failed to write contact event:', err instanceof Error ? err.message : err)
  }
}
