/**
 * Shared Drizzle database client for the API runtime.
 */

import { createDb, type ParkSafeDb } from '@parksafe/db'
import { isOtpDevMode } from '../types/env'

let dbInstance: ParkSafeDb | null = null

/**
 * Returns the shared Drizzle instance. Lazy-initialised on first use.
 * In OTP dev mode without DATABASE_URL, returns null (services use dev-store).
 */
export function getDb(): ParkSafeDb | null {
  const url = process.env['DATABASE_URL']
  if (!url) {
    if (!isOtpDevMode) {
      throw new Error('DATABASE_URL is required when OTP_DEV_MODE=false')
    }
    return null
  }
  if (!dbInstance) {
    dbInstance = createDb(url).db
  }
  return dbInstance
}

/** Resets the singleton — for integration tests only. */
export function resetDbForTests(): void {
  dbInstance = null
}
