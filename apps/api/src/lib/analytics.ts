/**
 * Server-side PostHog capture — fire-and-forget HTTP, no PII in properties.
 */

import crypto from 'node:crypto'
import type { ServerAnalyticsEvent } from '@parksafe/types'

const ADMIN_DISTINCT_ID = 'admin:system'

let warnedMissingKey = false

function getConfig(): { key: string; host: string } | null {
  const key = process.env['POSTHOG_KEY']?.trim()
  if (!key) {
    if (process.env['NODE_ENV'] === 'production' && !warnedMissingKey) {
      warnedMissingKey = true
      console.warn('[analytics] POSTHOG_KEY not set — server events disabled')
    }
    return null
  }

  if (process.env['POSTHOG_DISABLED'] === 'true') return null

  const enabledInDev = process.env['POSTHOG_ENABLED'] === 'true'
  if (process.env['NODE_ENV'] !== 'production' && !enabledInDev) return null

  const host = (process.env['POSTHOG_HOST'] ?? 'https://us.i.posthog.com').replace(/\/$/, '')
  return { key, host }
}

/** Hash opaque session / IP strings before using as distinct IDs. */
export function hashDistinctId(value: string): string {
  return crypto.createHash('sha256').update(value).digest('hex').slice(0, 32)
}

export function adminDistinctId(): string {
  return ADMIN_DISTINCT_ID
}

async function sendCapture(
  distinctId: string,
  event: ServerAnalyticsEvent['event'],
  properties: ServerAnalyticsEvent['properties']
): Promise<void> {
  const config = getConfig()
  if (!config) return

  const body = {
    api_key: config.key,
    event,
    distinct_id: distinctId,
    properties: {
      ...properties,
      source: 'api',
    },
    timestamp: new Date().toISOString(),
  }

  const res = await fetch(`${config.host}/capture/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(5_000),
  })

  if (!res.ok) {
    console.warn(`[analytics] PostHog capture failed (${res.status}) for ${event}`)
  }
}

/** Non-blocking server event — never throws to callers. */
export function trackServer(
  distinctId: string,
  payload: ServerAnalyticsEvent
): void {
  void sendCapture(distinctId, payload.event, payload.properties).catch(err => {
    console.warn(
      '[analytics] PostHog capture error:',
      err instanceof Error ? err.message : err
    )
  })
}

/** Test helper — resets one-time production warning. */
export function resetAnalyticsWarningsForTests(): void {
  warnedMissingKey = false
}
