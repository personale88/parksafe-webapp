import crypto from 'node:crypto'
import { env, isOtpDevMode } from '../../types/env'

interface WhatsAppOptions {
  /** Recipient phone in E.164 format */
  to: string
  body: string
}

interface WhatsAppResult {
  success: boolean
  providerMessageId?: string
  error?: string
}

/**
 * WhatsApp Business API adapter via Meta Graph API.
 * Uses text message template — free-form messages require 24h session window.
 */
export const whatsappAdapter = {
  /**
   * Sends a WhatsApp message via Meta Graph API.
   * @param options - Recipient phone and message body
   */
  async sendMessage(options: WhatsAppOptions): Promise<WhatsAppResult> {
    if (isOtpDevMode) {
      console.log('[whatsapp.dev] Relay simulated (dev mode, no Meta API call)')
      return { success: true, providerMessageId: `dev-wa-${crypto.randomUUID()}` }
    }

    const url = `https://graph.facebook.com/v19.0/${env.WHATSAPP_PHONE_ID}/messages`

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${env.WHATSAPP_ACCESS_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to: options.to,
          type: 'text',
          text: { body: options.body },
        }),
      })

      if (!res.ok) {
        const errorData = (await res.json()) as { error?: { message?: string } }
        throw new Error(errorData.error?.message ?? `HTTP ${res.status}`)
      }

      const data = (await res.json()) as { messages?: Array<{ id: string }> }
      const messageId = data.messages?.[0]?.id
      return {
        success: true,
        ...(messageId ? { providerMessageId: messageId } : {}),
      }
    } catch (err) {
      const error = err instanceof Error ? err.message : 'WhatsApp dispatch failed'
      console.error('[whatsapp] Message dispatch failed:', error)
      return { success: false, error }
    }
  },
}
