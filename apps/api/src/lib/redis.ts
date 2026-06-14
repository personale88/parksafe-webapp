import { Redis } from '@upstash/redis'
import { env } from '../types/env'
import { createInMemoryRedis } from './redis.memory'

/** True only when both Upstash vars are set in the environment (not dev defaults). */
export function isUpstashConfigured(): boolean {
  return Boolean(
    process.env['UPSTASH_REDIS_REST_URL'] && process.env['UPSTASH_REDIS_REST_TOKEN']
  )
}

/**
 * OTP / rate-limit store.
 * Uses Upstash when UPSTASH_REDIS_* is configured; otherwise in-memory (local/single-instance).
 */
export const redis = isUpstashConfigured()
  ? new Redis({
      url: env.UPSTASH_REDIS_REST_URL!,
      token: env.UPSTASH_REDIS_REST_TOKEN!,
    })
  : createInMemoryRedis()

if (!isUpstashConfigured()) {
  console.warn(
    '[redis] UPSTASH_REDIS_REST_URL/TOKEN not set — OTP stored in memory only (resets on restart; not for multi-instance production)'
  )
}
