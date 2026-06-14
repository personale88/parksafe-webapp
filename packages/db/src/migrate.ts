/**
 * Applies Drizzle journal migrations + manual incremental SQL files.
 * Usage: DATABASE_URL=... pnpm db:migrate
 */

import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { drizzle } from 'drizzle-orm/postgres-js'
import { migrate } from 'drizzle-orm/postgres-js/migrator'
import postgres from 'postgres'
import { resolveDatabaseUrl } from './load-env'

/** Resolved from package root when running `pnpm db:migrate` in packages/db. */
const MIGRATIONS_DIR = join(process.cwd(), 'src', 'migrations')

/** Manual SQL files applied after Drizzle journal (sorted by filename). */
const MANUAL_MIGRATIONS = [
  '002_dashboard_profile.sql',
  '003_custom_auth.sql',
  '004_phone_and_sessions.sql',
  '005_tag_batches.sql',
  '006_remove_sms_channel.sql',
] as const

async function ensureManualMigrationsTable(sql: ReturnType<typeof postgres>) {
  await sql`
    CREATE TABLE IF NOT EXISTS parksafe_manual_migrations (
      name text PRIMARY KEY,
      applied_at timestamptz DEFAULT now() NOT NULL
    )
  `
}

async function applyManualMigrations(sql: ReturnType<typeof postgres>) {
  await ensureManualMigrationsTable(sql)

  for (const name of MANUAL_MIGRATIONS) {
    const rows = await sql<{ exists: boolean }[]>`
      SELECT EXISTS(
        SELECT 1 FROM parksafe_manual_migrations WHERE name = ${name}
      ) AS exists
    `

    if (rows[0]?.exists) {
      console.log(`[migrate] Skip (already applied): ${name}`)
      continue
    }

    const filePath = join(MIGRATIONS_DIR, name)
    const contents = readFileSync(filePath, 'utf8')
    console.log(`[migrate] Applying: ${name}`)
    await sql.unsafe(contents)
    await sql`INSERT INTO parksafe_manual_migrations (name) VALUES (${name})`
    console.log(`[migrate] Done: ${name}`)
  }
}

async function main() {
  const databaseUrl = resolveDatabaseUrl()
  if (!databaseUrl) {
    console.error(
      '[migrate] DATABASE_URL is required — set it in the environment or apps/api/.env',
    )
    process.exit(1)
  }

  const sql = postgres(databaseUrl, { max: 1 })
  const db = drizzle(sql)

  try {
    console.log('[migrate] Running Drizzle journal migrations...')
    await migrate(db, { migrationsFolder: MIGRATIONS_DIR })
    console.log('[migrate] Drizzle journal complete')

    await applyManualMigrations(sql)

    const journalFiles = readdirSync(MIGRATIONS_DIR).filter(f => f.endsWith('.sql'))
    console.log(`[migrate] All migrations complete (${journalFiles.length} SQL files in folder)`)
  } finally {
    await sql.end()
  }
}

main().catch(err => {
  console.error('[migrate] Failed:', err)
  process.exit(1)
})
