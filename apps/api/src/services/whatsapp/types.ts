import type { IssueType } from '@parksafe/types'

/** Every WhatsApp send maps to one registry entry. */
export enum WhatsAppTemplateKey {
  OTP = 'OTP',
  CONTACT_BLOCKING_VEHICLE = 'CONTACT_BLOCKING_VEHICLE',
  CONTACT_WRONG_PARKING = 'CONTACT_WRONG_PARKING',
  CONTACT_LIGHTS_ON = 'CONTACT_LIGHTS_ON',
  CONTACT_DOOR_OPEN = 'CONTACT_DOOR_OPEN',
  CONTACT_FLAT_TYRE = 'CONTACT_FLAT_TYRE',
  CONTACT_FLUID_LEAKING = 'CONTACT_FLUID_LEAKING',
  CONTACT_VEHICLE_DAMAGE = 'CONTACT_VEHICLE_DAMAGE',
  CONTACT_EMERGENCY = 'CONTACT_EMERGENCY',
}

export type WhatsAppTemplateCategory = 'AUTHENTICATION' | 'UTILITY' | 'MARKETING'

export interface TemplateSendContext {
  /** E.164 phone number */
  phone: string
  otp?: string
  issueType?: IssueType
  customNote?: string
  userName?: string
  source?: string
  /** Arbitrary keyed params for future templates */
  params?: Record<string, string>
}

export interface TemplateButtonParameter {
  type: 'text'
  text: string
}

/** Meta/AiSensy button component — auth OTP "Copy code" URL buttons use index 0. */
export interface TemplateButtonComponent {
  type: 'button'
  sub_type: 'url'
  index: number
  parameters: TemplateButtonParameter[]
}

export interface TemplateDefinition {
  key: WhatsAppTemplateKey
  category: WhatsAppTemplateCategory
  /** Env var name holding AiSensy Live campaign name (or Meta template name) */
  campaignEnvKey: string
  /** Builds templateParams array in {{1}}, {{2}} order */
  buildParams: (ctx: TemplateSendContext) => string[]
  /** Optional URL/copy-code button params (authentication templates) */
  buildButtonComponents?: (ctx: TemplateSendContext) => TemplateButtonComponent[] | undefined
  /** Fallback campaign name for docs/dev when env is unset */
  defaultCampaignName: string
  /** When true, customNote is appended as an extra template param when present */
  supportsCustomNote?: boolean
}

export interface WhatsAppSendResult {
  success: boolean
  providerMessageId?: string
  error?: string
}

export interface WhatsAppProviderAdapter {
  sendTemplate(opts: {
    campaignName: string
    destination: string
    templateParams: string[]
    buttons?: TemplateButtonComponent[]
    userName?: string
    source?: string
  }): Promise<WhatsAppSendResult>
}

export type WhatsAppProvider = 'aisensy' | 'meta'
