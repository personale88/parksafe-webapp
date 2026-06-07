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
}

function loadEnv(): Env {
  const nodeEnv = (process.env.NODE_ENV ?? 'development') as Env['NODE_ENV']
  const otpDevMode = nodeEnv === 'development' && process.env.OTP_DEV_MODE !== 'false'
  const useDevDefaults =
    otpDevMode && process.env.USE_PRODUCTION_ENV !== 'true' && !process.env.DATABASE_URL

  const merged = useDevDefaults
    ? { ...DEV_ENV_DEFAULTS, ...process.env, NODE_ENV: nodeEnv }
    : { ...process.env, NODE_ENV: nodeEnv }

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
}

export const env = loadEnv()

/** Local dev: in-memory OTP store + dev-store. Set OTP_DEV_MODE=false for production path. */
export const isOtpDevMode =
  env.NODE_ENV === 'development' && process.env.OTP_DEV_MODE !== 'false'
