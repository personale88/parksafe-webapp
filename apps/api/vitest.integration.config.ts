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
      WHATSAPP_PROVIDER: 'aisensy',
      AISENSY_API_KEY: 'test-aisensy-api-key',
      AISENSY_CAMPAIGN_OTP: 'ParkSafe_OTP',
      AISENSY_CAMPAIGN_BLOCKING_VEHICLE: 'ParkSafe_Blocking',
      AISENSY_CAMPAIGN_WRONG_PARKING: 'ParkSafe_WrongParking',
      AISENSY_CAMPAIGN_LIGHTS_ON: 'ParkSafe_LightsOn',
      AISENSY_CAMPAIGN_DOOR_OPEN: 'ParkSafe_DoorOpen',
      AISENSY_CAMPAIGN_FLAT_TYRE: 'ParkSafe_FlatTyre',
      AISENSY_CAMPAIGN_FLUID_LEAKING: 'ParkSafe_FluidLeaking',
      AISENSY_CAMPAIGN_VEHICLE_DAMAGE: 'ParkSafe_VehicleDamage',
      AISENSY_CAMPAIGN_EMERGENCY: 'ParkSafe_Emergency',
      UPSTASH_REDIS_REST_URL: 'https://localhost',
      UPSTASH_REDIS_REST_TOKEN: 'test-redis-token',
    },
  },
})
