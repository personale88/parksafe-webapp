import { IssueType } from '@parksafe/types'
import {
  WhatsAppTemplateKey,
  type TemplateDefinition,
  type TemplateSendContext,
} from './types'

function otpParams(ctx: TemplateSendContext): string[] {
  if (!ctx.otp) return []
  // Body: "{{1}} is your verification code."
  return [ctx.otp]
}

/** Copy-code URL button at index 0 — same OTP value as body {{1}}. */
function otpButtonComponents(ctx: TemplateSendContext) {
  if (!ctx.otp) return undefined
  return [
    {
      type: 'button' as const,
      sub_type: 'url' as const,
      index: 0,
      parameters: [{ type: 'text' as const, text: ctx.otp }],
    },
  ]
}

function contactParams(ctx: TemplateSendContext): string[] {
  const params: string[] = []
  if (ctx.customNote) {
    params.push(ctx.customNote)
  }
  return params
}

/** Static contact templates — body text lives in AiSensy; optional {{1}} for reporter note. */
function contactDef(
  key: WhatsAppTemplateKey,
  campaignEnvKey: string,
  defaultCampaignName: string
): TemplateDefinition {
  return {
    key,
    category: 'UTILITY',
    campaignEnvKey,
    defaultCampaignName,
    buildParams: contactParams,
    supportsCustomNote: true,
  }
}

export const TEMPLATE_REGISTRY: Record<WhatsAppTemplateKey, TemplateDefinition> = {
  [WhatsAppTemplateKey.OTP]: {
    key: WhatsAppTemplateKey.OTP,
    category: 'AUTHENTICATION',
    campaignEnvKey: 'AISENSY_CAMPAIGN_OTP',
    defaultCampaignName: 'ParkSafe_OTP',
    buildParams: otpParams,
    buildButtonComponents: otpButtonComponents,
  },
  [WhatsAppTemplateKey.CONTACT_BLOCKING_VEHICLE]: contactDef(
    WhatsAppTemplateKey.CONTACT_BLOCKING_VEHICLE,
    'AISENSY_CAMPAIGN_BLOCKING_VEHICLE',
    'ParkSafe_Blocking'
  ),
  [WhatsAppTemplateKey.CONTACT_WRONG_PARKING]: contactDef(
    WhatsAppTemplateKey.CONTACT_WRONG_PARKING,
    'AISENSY_CAMPAIGN_WRONG_PARKING',
    'ParkSafe_WrongParking'
  ),
  [WhatsAppTemplateKey.CONTACT_LIGHTS_ON]: contactDef(
    WhatsAppTemplateKey.CONTACT_LIGHTS_ON,
    'AISENSY_CAMPAIGN_LIGHTS_ON',
    'ParkSafe_LightsOn'
  ),
  [WhatsAppTemplateKey.CONTACT_DOOR_OPEN]: contactDef(
    WhatsAppTemplateKey.CONTACT_DOOR_OPEN,
    'AISENSY_CAMPAIGN_DOOR_OPEN',
    'ParkSafe_DoorOpen'
  ),
  [WhatsAppTemplateKey.CONTACT_FLAT_TYRE]: contactDef(
    WhatsAppTemplateKey.CONTACT_FLAT_TYRE,
    'AISENSY_CAMPAIGN_FLAT_TYRE',
    'ParkSafe_FlatTyre'
  ),
  [WhatsAppTemplateKey.CONTACT_FLUID_LEAKING]: contactDef(
    WhatsAppTemplateKey.CONTACT_FLUID_LEAKING,
    'AISENSY_CAMPAIGN_FLUID_LEAKING',
    'ParkSafe_FluidLeaking'
  ),
  [WhatsAppTemplateKey.CONTACT_VEHICLE_DAMAGE]: contactDef(
    WhatsAppTemplateKey.CONTACT_VEHICLE_DAMAGE,
    'AISENSY_CAMPAIGN_VEHICLE_DAMAGE',
    'ParkSafe_VehicleDamage'
  ),
  [WhatsAppTemplateKey.CONTACT_EMERGENCY]: contactDef(
    WhatsAppTemplateKey.CONTACT_EMERGENCY,
    'AISENSY_CAMPAIGN_EMERGENCY',
    'ParkSafe_Emergency'
  ),
}

const ISSUE_TO_TEMPLATE: Record<IssueType, WhatsAppTemplateKey> = {
  [IssueType.BLOCKING_VEHICLE]: WhatsAppTemplateKey.CONTACT_BLOCKING_VEHICLE,
  [IssueType.WRONG_PARKING]: WhatsAppTemplateKey.CONTACT_WRONG_PARKING,
  [IssueType.LIGHTS_ON]: WhatsAppTemplateKey.CONTACT_LIGHTS_ON,
  [IssueType.DOOR_OPEN]: WhatsAppTemplateKey.CONTACT_DOOR_OPEN,
  [IssueType.FLAT_TYRE]: WhatsAppTemplateKey.CONTACT_FLAT_TYRE,
  [IssueType.FLUID_LEAKING]: WhatsAppTemplateKey.CONTACT_FLUID_LEAKING,
  [IssueType.VEHICLE_DAMAGE]: WhatsAppTemplateKey.CONTACT_VEHICLE_DAMAGE,
  [IssueType.EMERGENCY]: WhatsAppTemplateKey.CONTACT_EMERGENCY,
}

export function getTemplateDefinition(key: WhatsAppTemplateKey): TemplateDefinition {
  return TEMPLATE_REGISTRY[key]
}

export function resolveCampaignName(key: WhatsAppTemplateKey): string {
  const def = TEMPLATE_REGISTRY[key]
  return process.env[def.campaignEnvKey] ?? def.defaultCampaignName
}

export function issueTypeToTemplateKey(issueType: IssueType): WhatsAppTemplateKey {
  return ISSUE_TO_TEMPLATE[issueType]
}

/** All campaign env keys — used for production validation. */
export function getAllCampaignEnvKeys(): string[] {
  return Object.values(TEMPLATE_REGISTRY).map(d => d.campaignEnvKey)
}
