import { describe, it, expect } from 'vitest'
import { IssueType } from '@parksafe/types'
import { WhatsAppTemplateKey } from '../../src/services/whatsapp/types'
import {
  getTemplateDefinition,
  issueTypeToTemplateKey,
  resolveCampaignName,
} from '../../src/services/whatsapp/template-registry'

describe('template-registry', () => {
  it('OTP buildParams sends single code for "{{1}} is your verification code." template', () => {
    const def = getTemplateDefinition(WhatsAppTemplateKey.OTP)
    expect(def.buildParams({ phone: '+917731878888', otp: '482910' })).toEqual(['482910'])
  })

  it('OTP buildButtonComponents sends copy-code URL button param', () => {
    const def = getTemplateDefinition(WhatsAppTemplateKey.OTP)
    expect(def.buildButtonComponents?.({ phone: '+917731878888', otp: '482910' })).toEqual([
      {
        type: 'button',
        sub_type: 'url',
        index: 0,
        parameters: [{ type: 'text', text: '482910' }],
      },
    ])
  })

  it('OTP buildParams returns empty array when otp missing', () => {
    const def = getTemplateDefinition(WhatsAppTemplateKey.OTP)
    expect(def.buildParams({ phone: '+917731878888' })).toEqual([])
  })

  it('resolves campaign name from env override', () => {
    process.env['AISENSY_CAMPAIGN_OTP'] = 'parksafe'
    expect(resolveCampaignName(WhatsAppTemplateKey.OTP)).toBe('parksafe')
    delete process.env['AISENSY_CAMPAIGN_OTP']
  })

  it('maps all issue types to contact template keys', () => {
    expect(issueTypeToTemplateKey(IssueType.LIGHTS_ON)).toBe(
      WhatsAppTemplateKey.CONTACT_LIGHTS_ON
    )
    expect(issueTypeToTemplateKey(IssueType.EMERGENCY)).toBe(
      WhatsAppTemplateKey.CONTACT_EMERGENCY
    )
  })
})
