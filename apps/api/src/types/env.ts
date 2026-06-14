import { z } from 'zod'

/**
 * Type-safe environment variable validation.
 * In OTP dev mode, DATABASE_URL and JWT secrets are optional (dev-store used).
 */

const whatsappProviderSchema = z.enum(['aisensy', 'meta'])

const baseEnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']),
  ALLOWED_ORIGIN: z.string().url(),

  DATABASE_URL: z.string().url().optional(),

  JWT_ACCESS_SECRET: z.string().min(32).optional(),
  JWT_REFRESH_SECRET: z.string().min(32).optional(),
  PII_ENCRYPTION_KEY: z.string().min(32).optional(),

  OTP_HMAC_SECRET: z.string().min(32),
  SESSION_SIGNING_SECRET: z.string().min(32),

  WHATSAPP_PROVIDER: whatsappProviderSchema.optional(),

  AISENSY_API_KEY: z.string().min(1).optional(),
  AISENSY_API_URL: z.string().url().optional(),

  AISENSY_CAMPAIGN_OTP: z.string().min(1).optional(),
  AISENSY_CAMPAIGN_BLOCKING_VEHICLE: z.string().min(1).optional(),
  AISENSY_CAMPAIGN_WRONG_PARKING: z.string().min(1).optional(),
  AISENSY_CAMPAIGN_LIGHTS_ON: z.string().min(1).optional(),
  AISENSY_CAMPAIGN_DOOR_OPEN: z.string().min(1).optional(),
  AISENSY_CAMPAIGN_FLAT_TYRE: z.string().min(1).optional(),
  AISENSY_CAMPAIGN_FLUID_LEAKING: z.string().min(1).optional(),
  AISENSY_CAMPAIGN_VEHICLE_DAMAGE: z.string().min(1).optional(),
  AISENSY_CAMPAIGN_EMERGENCY: z.string().min(1).optional(),

  WHATSAPP_ACCESS_TOKEN: z.string().min(1).optional(),
  WHATSAPP_PHONE_ID: z.string().min(1).optional(),

  EXOTEL_SID: z.string().min(1).optional(),
  EXOTEL_TOKEN: z.string().min(1).optional(),
  EXOTEL_CALLER_ID: z.string().optional(),

  UPSTASH_REDIS_REST_URL: z.string().url().optional(),
  UPSTASH_REDIS_REST_TOKEN: z.string().min(1).optional(),

  /** Admin QR generation — required in production */
  ADMIN_API_KEY: z.string().min(32).optional(),
  /** Public site URL encoded in generated QR codes */
  SITE_URL: z.string().url().optional(),
})

export type Env = z.infer<typeof baseEnvSchema>

const DEV_ENV_DEFAULTS: Record<string, string> = {
  NODE_ENV: 'development',
  ALLOWED_ORIGIN: 'http://localhost:3000',
  OTP_HMAC_SECRET: 'dev-only-otp-hmac-secret-32chars-min',
  SESSION_SIGNING_SECRET: 'dev-only-session-signing-32chars-min',
  JWT_ACCESS_SECRET: 'dev-only-jwt-access-secret-32chars-min',
  JWT_REFRESH_SECRET: 'dev-only-jwt-refresh-secret-32chars-min',
  PII_ENCRYPTION_KEY: 'dev-only-pii-encryption-key-32chars-min',
  WHATSAPP_PROVIDER: 'aisensy',
  AISENSY_API_KEY: 'dev-aisensy-api-key',
  WHATSAPP_ACCESS_TOKEN: 'dev-whatsapp-token',
  WHATSAPP_PHONE_ID: 'dev-phone-id',
  ADMIN_API_KEY: 'dev-only-admin-api-key-32chars-minimum',
  SITE_URL: 'http://localhost:3000',
}

function isOtpDevModeEnabled(nodeEnv: Env['NODE_ENV']): boolean {
  return (
    process.env.OTP_DEV_MODE === 'true' ||
    (nodeEnv === 'development' && process.env.OTP_DEV_MODE !== 'false')
  )
}

function getWhatsAppProvider(merged: Record<string, string | undefined>): 'aisensy' | 'meta' {
  const raw = merged['WHATSAPP_PROVIDER'] ?? 'aisensy'
  return raw === 'meta' ? 'meta' : 'aisensy'
}

function loadEnv(): Env {
  const nodeEnv = (process.env.NODE_ENV ?? 'development') as Env['NODE_ENV']
  const otpDevMode = isOtpDevModeEnabled(nodeEnv)

  const merged: Record<string, string | undefined> = { ...process.env, NODE_ENV: nodeEnv }

  if (otpDevMode && process.env.USE_PRODUCTION_ENV !== 'true') {
    for (const [key, value] of Object.entries(DEV_ENV_DEFAULTS)) {
      if (!merged[key]) {
        merged[key] = value
      }
    }
  }

  try {
    const parsed = baseEnvSchema.parse(merged)

    if (!otpDevMode) {
      const productionBase = z.object({
        DATABASE_URL: z.string().url(),
        JWT_ACCESS_SECRET: z.string().min(32),
        JWT_REFRESH_SECRET: z.string().min(32),
        PII_ENCRYPTION_KEY: z.string().min(32),
      })
      productionBase.parse(merged)

      const provider = getWhatsAppProvider(merged)
      if (provider === 'aisensy') {
        z.object({
          AISENSY_API_KEY: z.string().min(1),
          AISENSY_CAMPAIGN_OTP: z.string().min(1),
          AISENSY_CAMPAIGN_BLOCKING_VEHICLE: z.string().min(1),
          AISENSY_CAMPAIGN_WRONG_PARKING: z.string().min(1),
          AISENSY_CAMPAIGN_LIGHTS_ON: z.string().min(1),
          AISENSY_CAMPAIGN_DOOR_OPEN: z.string().min(1),
          AISENSY_CAMPAIGN_FLAT_TYRE: z.string().min(1),
          AISENSY_CAMPAIGN_FLUID_LEAKING: z.string().min(1),
          AISENSY_CAMPAIGN_VEHICLE_DAMAGE: z.string().min(1),
          AISENSY_CAMPAIGN_EMERGENCY: z.string().min(1),
        }).parse(merged)
      } else {
        z.object({
          WHATSAPP_ACCESS_TOKEN: z.string().min(1),
          WHATSAPP_PHONE_ID: z.string().min(1),
        }).parse(merged)
      }
    }

    return parsed
  } catch (err) {
    if (err instanceof z.ZodError) {
      console.error('[api] Environment validation failed:')
      for (const issue of err.issues) {
        console.error(`  - ${issue.path.join('.')}: ${issue.message}`)
      }
      console.error(
        '[api] Set missing variables in Railway → Variables. For staging, use OTP_DEV_MODE=true.'
      )
    }
    throw err
  }
}

export const env = loadEnv()

/** In-memory OTP store + dev defaults. Set OTP_DEV_MODE=false for full production path. */
export const isOtpDevMode = isOtpDevModeEnabled(env.NODE_ENV)

export function getEnvWhatsAppProvider(): 'aisensy' | 'meta' {
  return getWhatsAppProvider(process.env as Record<string, string | undefined>)
}
