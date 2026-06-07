import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    include: ['__tests__/**/*.integration.test.ts'],
    testTimeout: 30_000,
    hookTimeout: 60_000,
    pool: 'forks',
    poolOptions: {
      forks: {
        singleFork: true,
      },
    },
    env: {
      NODE_ENV: 'test',
      OTP_DEV_MODE: 'false',
      ALLOWED_ORIGIN: 'http://localhost:3000',
      JWT_ACCESS_SECRET: 'test-jwt-access-secret-32chars-minimum',
      JWT_REFRESH_SECRET: 'test-jwt-refresh-secret-32chars-minimum',
      PII_ENCRYPTION_KEY: 'test-pii-encryption-key-32chars-minimum',
      OTP_HMAC_SECRET: 'test-otp-hmac-secret-32chars-minimum',
      SESSION_SIGNING_SECRET: 'test-session-signing-32chars-minimum',
      TWILIO_ACCOUNT_SID: 'AC00000000000000000000000000000000',
      TWILIO_AUTH_TOKEN: 'test-twilio-token',
      TWILIO_RELAY_NUMBER: '+919999999999',
      WHATSAPP_ACCESS_TOKEN: 'test-whatsapp-token',
      WHATSAPP_PHONE_ID: 'test-phone-id',
      UPSTASH_REDIS_REST_URL: 'https://localhost',
      UPSTASH_REDIS_REST_TOKEN: 'test-redis-token',
    },
  },
})
