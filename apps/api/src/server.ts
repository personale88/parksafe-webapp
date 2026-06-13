/**
 * HTTP server entry point — starts the Hono app on PORT (default 3001).
 * Use this file for local dev and production start, not index.ts alone.
 */

import { serve } from '@hono/node-server'
import app from './index'
import { isOtpDevMode } from './types/env'

const port = Number(process.env.PORT ?? 3001)

if (isOtpDevMode) {
  console.log('[api] OTP dev mode: codes are logged to this terminal (no SMS)')
  const { seedDevData } = require('./services/dev-seed') as typeof import('./services/dev-seed')
  seedDevData()

  if (!process.env['DATABASE_URL']) {
    const { seedAdminDevData } =
      require('./services/admin-dev-store') as typeof import('./services/admin-dev-store')
    seedAdminDevData()
  }
}

if (process.env.NODE_ENV === 'development' && process.env['DATABASE_URL']) {
  const { seedAdminDbMockData } =
    require('./services/admin-db-seed') as typeof import('./services/admin-db-seed')
  void seedAdminDbMockData()
}

console.log(`[api] ParkSafe API listening on http://localhost:${port}`)

serve({ fetch: app.fetch, port, hostname: '0.0.0.0' })
