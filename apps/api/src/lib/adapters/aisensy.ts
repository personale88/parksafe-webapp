import crypto from 'node:crypto'
import { env, isOtpDevMode } from '../../types/env'
import type { WhatsAppProviderAdapter, WhatsAppSendResult } from '../../services/whatsapp/types'

const DEFAULT_AISENSY_URL = 'https://backend.aisensy.com/campaign/t1/api/v2'

/** Strip + prefix — AiSensy expects country code without plus (e.g. 919876543210). */
export function normalizeAisensyDestination(e164: string): string {
  return e164.replace(/^\+/, '')
}

export const aisensyAdapter: WhatsAppProviderAdapter = {
  async sendTemplate(opts): Promise<WhatsAppSendResult> {
    if (isOtpDevMode) {
      console.log('[aisensy.dev] Template send simulated (dev mode, no API call)')
      return { success: true, providerMessageId: `dev-aisensy-${crypto.randomUUID()}` }
    }

    const apiKey = env.AISENSY_API_KEY
    if (!apiKey) {
      return { success: false, error: 'AISENSY_API_KEY not configured' }
    }

    const url = env.AISENSY_API_URL ?? DEFAULT_AISENSY_URL

    try {
      const body: Record<string, unknown> = {
        apiKey,
        campaignName: opts.campaignName,
        destination: normalizeAisensyDestination(opts.destination),
        source: opts.source ?? 'ParkSafe',
        templateParams: opts.templateParams,
      }

      if (opts.userName) {
        body['userName'] = opts.userName
      }

      if (opts.buttons && opts.buttons.length > 0) {
        body['buttons'] = opts.buttons
      }

      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (!res.ok) {
        const errorData = (await res.json().catch(() => ({}))) as {
          message?: string
          error?: string
          errorMessage?: string
        }
        throw new Error(
          errorData.errorMessage ??
            errorData.message ??
            errorData.error ??
            `HTTP ${res.status}`
        )
      }

      const data = (await res.json().catch(() => ({}))) as {
        success?: boolean | string
        messageId?: string
        id?: string
        submitted_message_id?: string
      }

      const messageId = data.messageId ?? data.id ?? data.submitted_message_id
      return {
        success: data.success !== false && data.success !== 'false',
        ...(messageId ? { providerMessageId: messageId } : {}),
      }
    } catch (err) {
      const error = err instanceof Error ? err.message : 'AiSensy dispatch failed'
      console.error('[aisensy] Template send failed:', error)
      return { success: false, error }
    }
  },
}
