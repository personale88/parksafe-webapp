import { z } from 'zod'

/**
 * Type-safe environment variable validation.
 * In OTP dev mode, DATABASE_URL and JWT secrets are optional (dev-store used).
 */

const baseEnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']),
  ALLOWED_ORIGIN: z.string().url(),

  DATABASE_URL: z.string().url().optional(),

  JWT_ACCESS_SECRET: z.string().min(32).optional(),
  JWT_REFRESH_SECRET: z.string().min(32).optional(),
  PII_ENCRYPTION_KEY: z.string().min(32).optional(),

  OTP_HMAC_SECRET: z.string().min(32),
  SESSION_SIGNING_SECRET: z.string().min(32),

  TWILIO_ACCOUNT_SID: z.string().min(1).optional(),
  TWILIO_AUTH_TOKEN: z.string().min(1).optional(),
  TWILIO_RELAY_NUMBER: z.string().regex(/^\+\d{10,15}$/).optional(),

  WHATSAPP_ACCESS_TOKEN: z.string().min(1).optional(),
  WHATSAPP_PHONE_ID: z.string().min(1).optional(),

  EXOTEL_SID: z.string().min(1).optional(),
  EXOTEL_TOKEN: z.string().min(1).optional(),
  EXOTEL_CALLER_ID: z.string().optional(),

  MSG91_AUTH_KEY: z.string().min(1).optional(),
  MSG91_SENDER_ID: z.string().min(1).optional(),

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
  TWILIO_ACCOUNT_SID: 'AC00000000000000000000000000000000',
  TWILIO_AUTH_TOKEN: 'dev-twilio-token',
  TWILIO_RELAY_NUMBER: '+919999999999',
  WHATSAPP_ACCESS_TOKEN: 'dev-whatsapp-token',
  WHATSAPP_PHONE_ID: 'dev-phone-id',
  UPSTASH_REDIS_REST_URL: 'https://localhost',
  UPSTASH_REDIS_REST_TOKEN: 'dev-redis-token',
  ADMIN_API_KEY: 'dev-only-admin-api-key-32chars-minimum',
  SITE_URL: 'http://localhost:3000',
}

function isOtpDevModeEnabled(nodeEnv: Env['NODE_ENV']): boolean {
  return (
    process.env.OTP_DEV_MODE === 'true' ||
    (nodeEnv === 'development' && process.env.OTP_DEV_MODE !== 'false')
  )
}

function loadEnv(): Env {
  const nodeEnv = (process.env.NODE_ENV ?? 'development') as Env['NODE_ENV']
  const otpDevMode = isOtpDevModeEnabled(nodeEnv)

  const useDevDefaults =
    otpDevMode && process.env.USE_PRODUCTION_ENV !== 'true' && !process.env.DATABASE_URL

  const merged: Record<string, string | undefined> = useDevDefaults
    ? { ...DEV_ENV_DEFAULTS, ...process.env, NODE_ENV: nodeEnv }
    : { ...process.env, NODE_ENV: nodeEnv }

  // Dev fallback — admin key works locally even when DATABASE_URL is set
  if (otpDevMode && !merged['ADMIN_API_KEY']) {
    merged['ADMIN_API_KEY'] = DEV_ENV_DEFAULTS['ADMIN_API_KEY']
  }

  try {
    const parsed = baseEnvSchema.parse(merged)

    if (!otpDevMode) {
      const productionRequired = z.object({
        DATABASE_URL: z.string().url(),
        JWT_ACCESS_SECRET: z.string().min(32),
        JWT_REFRESH_SECRET: z.string().min(32),
        PII_ENCRYPTION_KEY: z.string().min(32),
        TWILIO_ACCOUNT_SID: z.string().min(1),
        TWILIO_AUTH_TOKEN: z.string().min(1),
        TWILIO_RELAY_NUMBER: z.string().regex(/^\+\d{10,15}$/),
        WHATSAPP_ACCESS_TOKEN: z.string().min(1),
        WHATSAPP_PHONE_ID: z.string().min(1),
        UPSTASH_REDIS_REST_URL: z.string().url(),
        UPSTASH_REDIS_REST_TOKEN: z.string().min(1),
      })
      productionRequired.parse(merged)
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
