import crypto from 'node:crypto'
import type { IssueType } from '@parksafe/types'
import { aisensyAdapter } from '../../lib/adapters/aisensy'
import { whatsappMetaAdapter } from '../../lib/adapters/whatsapp-meta'
import { isOtpDevMode } from '../../types/env'
import {
  getTemplateDefinition,
  issueTypeToTemplateKey,
  resolveCampaignName,
} from './template-registry'
import {
  WhatsAppTemplateKey,
  type TemplateSendContext,
  type WhatsAppProvider,
  type WhatsAppProviderAdapter,
  type WhatsAppSendResult,
} from './types'

function getProvider(): WhatsAppProvider {
  const raw = process.env['WHATSAPP_PROVIDER'] ?? 'aisensy'
  return raw === 'meta' ? 'meta' : 'aisensy'
}

function getAdapter(provider: WhatsAppProvider): WhatsAppProviderAdapter {
  return provider === 'meta' ? whatsappMetaAdapter : aisensyAdapter
}

/**
 * Single entry point for all WhatsApp template sends.
 * Callers pass a template key + context; registry resolves campaign and params.
 */
export async function send(
  key: WhatsAppTemplateKey,
  context: TemplateSendContext
): Promise<WhatsAppSendResult> {
  if (isOtpDevMode) {
    console.log(`[whatsapp.dev] Simulated send: template=${key}`)
    return { success: true, providerMessageId: `dev-wa-${crypto.randomUUID()}` }
  }

  const def = getTemplateDefinition(key)
  const campaignName = resolveCampaignName(key)
  const templateParams = def.buildParams(context)
  const buttons = def.buildButtonComponents?.(context)
  const provider = getProvider()
  const adapter = getAdapter(provider)

  return adapter.sendTemplate({
    campaignName,
    destination: context.phone,
    templateParams,
    ...(buttons ? { buttons } : {}),
    ...(context.userName !== undefined ? { userName: context.userName } : {}),
    source: context.source ?? 'ParkSafe',
  })
}

/** Sends OTP via WhatsApp authentication template. */
export async function sendOtp(phone: string, otp: string): Promise<WhatsAppSendResult> {
  return send(WhatsAppTemplateKey.OTP, { phone, otp, userName: 'ParkSafe User' })
}

/** Sends a contact relay alert for the given issue type. */
export async function sendContactAlert(opts: {
  phone: string
  issueType: IssueType
  customNote?: string
}): Promise<WhatsAppSendResult> {
  const key = issueTypeToTemplateKey(opts.issueType)
  return send(key, {
    phone: opts.phone,
    issueType: opts.issueType,
    ...(opts.customNote !== undefined ? { customNote: opts.customNote } : {}),
    userName: 'Vehicle Owner',
    source: 'ParkSafe Contact Relay',
  })
}

export const whatsappService = {
  send,
  sendOtp,
  sendContactAlert,
}

/** Exposed for unit tests */
export function resolveWhatsAppProvider(): WhatsAppProvider {
  return getProvider()
}
