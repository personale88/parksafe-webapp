/**
 * Drizzle database client factory — provider-agnostic PostgreSQL access.
 */

import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from './schema'

export type ParkSafeDb = ReturnType<typeof createDb>['db']
export type ParkSafeSql = ReturnType<typeof createDb>['sql']

/**
 * Creates a Drizzle client and underlying postgres.js connection.
 * Caller is responsible for calling sql.end() on shutdown when needed.
 */
export function createDb(databaseUrl: string) {
  const sql = postgres(databaseUrl, { max: 10 })
  const db = drizzle(sql, { schema })
  return { db, sql, schema }
}
