import { describe, it, expect, vi, beforeEach } from 'vitest'
import { IssueType } from '@parksafe/types'
import { WhatsAppTemplateKey } from '../../src/services/whatsapp/types'
import {
  issueTypeToTemplateKey,
  resolveCampaignName,
} from '../../src/services/whatsapp/template-registry'

vi.mock('../../src/lib/adapters/aisensy', () => ({
  aisensyAdapter: {
    sendTemplate: vi.fn().mockResolvedValue({ success: true, providerMessageId: 'wa-1' }),
  },
}))

vi.mock('../../src/lib/adapters/whatsapp-meta', () => ({
  whatsappMetaAdapter: {
    sendTemplate: vi.fn().mockResolvedValue({ success: true, providerMessageId: 'meta-1' }),
  },
}))

vi.mock('../../src/types/env', async importOriginal => {
  const actual = await importOriginal<typeof import('../../src/types/env')>()
  return {
    ...actual,
    isOtpDevMode: false,
  }
})

const { send, sendOtp, sendContactAlert } = await import('../../src/services/whatsapp/whatsapp.service')
const { aisensyAdapter } = await import('../../src/lib/adapters/aisensy')

describe('whatsapp.service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    process.env['WHATSAPP_PROVIDER'] = 'aisensy'
    process.env['AISENSY_CAMPAIGN_OTP'] = 'Test_OTP_Campaign'
    process.env['AISENSY_CAMPAIGN_LIGHTS_ON'] = 'Test_LightsOn'
  })

  it('maps issue types to contact template keys', () => {
    expect(issueTypeToTemplateKey(IssueType.LIGHTS_ON)).toBe(
      WhatsAppTemplateKey.CONTACT_LIGHTS_ON
    )
  })

  it('resolves campaign name from env', () => {
    expect(resolveCampaignName(WhatsAppTemplateKey.OTP)).toBe('Test_OTP_Campaign')
  })

  it('sendOtp delegates to AiSensy adapter with OTP body + URL button params', async () => {
    const result = await sendOtp('+919876543210', '123456')
    expect(result.success).toBe(true)
    expect(aisensyAdapter.sendTemplate).toHaveBeenCalledWith(
      expect.objectContaining({
        campaignName: 'Test_OTP_Campaign',
        destination: '+919876543210',
        templateParams: ['123456'],
        buttons: [
          {
            type: 'button',
            sub_type: 'url',
            index: 0,
            parameters: [{ type: 'text', text: '123456' }],
          },
        ],
      })
    )
  })

  it('sendContactAlert uses issue-specific campaign', async () => {
    await sendContactAlert({
      phone: '+919876543210',
      issueType: IssueType.LIGHTS_ON,
      customNote: 'Please check',
    })

    expect(aisensyAdapter.sendTemplate).toHaveBeenCalledWith(
      expect.objectContaining({
        campaignName: 'Test_LightsOn',
        templateParams: ['Please check'],
      })
    )
  })

  it('send passes custom source label', async () => {
    await send(WhatsAppTemplateKey.OTP, {
      phone: '+919876543210',
      otp: '999999',
      source: 'UnitTest',
    })

    expect(aisensyAdapter.sendTemplate).toHaveBeenCalledWith(
      expect.objectContaining({ source: 'UnitTest' })
    )
  })
})
