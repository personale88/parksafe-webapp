/**
 * Integration test database setup.
 *
 * SAFETY: Tests NEVER truncate your dev database. They use a separate
 * `*_test` database (e.g. parksafe → parksafe_test). Override with DATABASE_URL_TEST.
 */

import postgres from 'postgres'
import { drizzle } from 'drizzle-orm/postgres-js'
import { migrate } from 'drizzle-orm/postgres-js/migrator'
import { readFileSync } from 'node:fs'
import { join as pathJoin } from 'node:path'
import { fileURLToPath } from 'node:url'
import { resetDbForTests } from '../../src/lib/db'

const MANUAL_MIGRATIONS = [
  '002_dashboard_profile.sql',
  '003_custom_auth.sql',
  '004_phone_and_sessions.sql',
  '005_tag_batches.sql',
] as const

const migrationsDir = pathJoin(
  fileURLToPath(new URL('.', import.meta.url)),
  '../../../../packages/db/src/migrations'
)

let sql: ReturnType<typeof postgres> | null = null

/**
 * Resolves the isolated test database URL.
 * Priority: DATABASE_URL_TEST → DATABASE_URL with `_test` suffix on db name.
 */
export function resolveIntegrationDatabaseUrl(): string {
  const explicit = process.env['DATABASE_URL_TEST']
  if (explicit) return explicit

  const devUrl = process.env['DATABASE_URL']
  if (!devUrl) {
    throw new Error(
      'DATABASE_URL or DATABASE_URL_TEST is required for integration tests'
    )
  }

  const url = new URL(devUrl)
  const dbName = url.pathname.replace(/^\//, '')
  if (dbName.endsWith('_test')) return devUrl

  url.pathname = `/${dbName}_test`
  return url.toString()
}

/** Refuses to TRUNCATE unless the database name ends with `_test`. */
export function assertSafeToTruncate(databaseUrl: string): void {
  const dbName = new URL(databaseUrl).pathname.replace(/^\//, '')
  if (!dbName.endsWith('_test')) {
    throw new Error(
      `[integration-db] Refusing to truncate "${dbName}". ` +
        'Integration tests only wipe databases whose name ends with `_test`. ' +
        'Set DATABASE_URL_TEST=postgresql://.../parksafe_test explicitly.'
    )
  }
}

async function ensureTestDatabaseExists(testUrl: string): Promise<void> {
  const url = new URL(testUrl)
  const testDbName = url.pathname.replace(/^\//, '')
  url.pathname = '/postgres'

  const admin = postgres(url.toString(), { max: 1 })
  try {
    const rows = await admin<{ exists: boolean }[]>`
      SELECT EXISTS(
        SELECT 1 FROM pg_database WHERE datname = ${testDbName}
      ) AS exists
    `
    if (!rows[0]?.exists) {
      await admin.unsafe(`CREATE DATABASE "${testDbName}"`)
      console.log(`[integration-db] Created test database: ${testDbName}`)
    }
  } finally {
    await admin.end()
  }
}

async function applyManualMigration(client: ReturnType<typeof postgres>, name: string) {
  await client`
    CREATE TABLE IF NOT EXISTS parksafe_manual_migrations (
      name text PRIMARY KEY,
      applied_at timestamptz DEFAULT now() NOT NULL
    )
  `

  const exists = await client<{ exists: boolean }[]>`
    SELECT EXISTS(SELECT 1 FROM parksafe_manual_migrations WHERE name = ${name}) AS exists
  `
  if (exists[0]?.exists) return

  const contents = readFileSync(pathJoin(migrationsDir, name), 'utf8')
  await client.unsafe(contents)
  await client`INSERT INTO parksafe_manual_migrations (name) VALUES (${name})`
}

export async function setupIntegrationDb(): Promise<void> {
  const url = resolveIntegrationDatabaseUrl()
  assertSafeToTruncate(url)

  await ensureTestDatabaseExists(url)

  sql = postgres(url, { max: 1 })
  const db = drizzle(sql)

  await migrate(db, { migrationsFolder: migrationsDir })
  for (const name of MANUAL_MIGRATIONS) {
    await applyManualMigration(sql, name)
  }

  process.env['DATABASE_URL'] = url
  resetDbForTests()
  console.log(`[integration-db] Using isolated test database: ${new URL(url).pathname.slice(1)}`)
}

export async function truncateAllTables(): Promise<void> {
  if (!sql) return

  const url = resolveIntegrationDatabaseUrl()
  assertSafeToTruncate(url)

  await sql`
    TRUNCATE TABLE
      auth_sessions,
      contact_events,
      otp_attempts,
      user_settings,
      tags,
      vehicles,
      users
    RESTART IDENTITY CASCADE
  `
}

export async function teardownIntegrationDb(): Promise<void> {
  if (sql) {
    await sql.end()
    sql = null
  }
  resetDbForTests()
}
