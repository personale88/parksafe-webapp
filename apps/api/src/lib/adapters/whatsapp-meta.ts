import crypto from 'node:crypto'
import { env, isOtpDevMode } from '../../types/env'
import type { WhatsAppProviderAdapter, WhatsAppSendResult } from '../../services/whatsapp/types'
import { normalizeAisensyDestination } from './aisensy'

/**
 * Meta Graph API adapter — migration fallback when WHATSAPP_PROVIDER=meta.
 * Sends approved template messages via Cloud API.
 */
export const whatsappMetaAdapter: WhatsAppProviderAdapter = {
  async sendTemplate(opts): Promise<WhatsAppSendResult> {
    if (isOtpDevMode) {
      console.log('[whatsapp-meta.dev] Template send simulated (dev mode, no Meta API call)')
      return { success: true, providerMessageId: `dev-meta-${crypto.randomUUID()}` }
    }

    const phoneId = env.WHATSAPP_PHONE_ID
    const token = env.WHATSAPP_ACCESS_TOKEN
    if (!phoneId || !token) {
      return { success: false, error: 'WHATSAPP_PHONE_ID / WHATSAPP_ACCESS_TOKEN not configured' }
    }

    const url = `https://graph.facebook.com/v19.0/${phoneId}/messages`
    const to = normalizeAisensyDestination(opts.destination)

    const bodyComponents =
      opts.templateParams.length > 0
        ? [
            {
              type: 'body',
              parameters: opts.templateParams.map(text => ({ type: 'text', text })),
            },
          ]
        : []

    const buttonComponents = (opts.buttons ?? []).map(btn => ({
      type: btn.type,
      sub_type: btn.sub_type,
      index: String(btn.index),
      parameters: btn.parameters,
    }))

    const components = [...bodyComponents, ...buttonComponents]

    const payload: Record<string, unknown> = {
      messaging_product: 'whatsapp',
      to,
      type: 'template',
      template: {
        name: opts.campaignName,
        language: { code: 'en_US' },
        ...(components.length > 0 ? { components } : {}),
      },
    }

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
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
      const error = err instanceof Error ? err.message : 'Meta WhatsApp dispatch failed'
      console.error('[whatsapp-meta] Template send failed:', error)
      return { success: false, error }
    }
  },
}
