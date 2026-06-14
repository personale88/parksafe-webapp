import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

/** Candidate `.env` paths when running from `packages/db` or repo root. */
const ENV_FILE_CANDIDATES = [
  join(process.cwd(), '../../apps/api/.env'),
  join(process.cwd(), 'apps/api/.env'),
]

function parseDatabaseUrlFromFile(path: string): string | undefined {
  const content = readFileSync(path, 'utf8')
  for (const line of content.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    if (!trimmed.startsWith('DATABASE_URL=')) continue

    const raw = trimmed.slice('DATABASE_URL='.length).trim()
    if (!raw) continue
    return raw.replace(/^["']|["']$/g, '')
  }
  return undefined
}

/**
 * Resolves DATABASE_URL from the environment or `apps/api/.env`.
 * Explicit env vars take precedence (CI, production, custom shells).
 */
export function resolveDatabaseUrl(): string | undefined {
  if (process.env['DATABASE_URL']) {
    return process.env['DATABASE_URL']
  }

  for (const path of ENV_FILE_CANDIDATES) {
    if (!existsSync(path)) continue
    const url = parseDatabaseUrlFromFile(path)
    if (url) return url
  }

  return undefined
}
