/**
 * apps/api/src/index.ts
 * Hono.js application entry point — mounts all routers and global middleware.
 * Route handlers are intentionally thin — all logic lives in /services.
 */

import { Hono } from 'hono'
import { secureHeaders } from 'hono/secure-headers'
import { authRoutes } from './routes/auth'
import { tagRoutes } from './routes/tags'
import { vehicleRoutes } from './routes/vehicles'
import { dashboardRoutes } from './routes/dashboard'
import { profileRoutes } from './routes/profile'
import { contactRoutes } from './routes/contact'
import { registrationRoutes } from './routes/registration'
import { adminRoutes } from './routes/admin'
import { authMiddleware } from './middleware/auth.middleware'
import { rateLimitMiddleware } from './middleware/rateLimit.middleware'
import { corsMiddleware } from './middleware/security.middleware'
import { loggerMiddleware } from './middleware/logger.middleware'

const app = new Hono()

// ── Global Middleware ─────────────────────────────────────────────────────────
app.use('*', secureHeaders())
app.use('*', corsMiddleware)
app.use('*', loggerMiddleware)

// ── Health Check ─────────────────────────────────────────────────────────────
app.get('/health', c => c.json({ status: 'ok', service: 'parksafe-api' }))

// ── Public Routes (no auth required) ─────────────────────────────────────────
// Auth: OTP request + verification
app.route('/auth', authRoutes)

// Registration: OTP-verified owner onboarding
app.route('/registration', registrationRoutes)

// Tags: public GET for reporter QR scan — returns masked vehicle info only
app.route('/tags', tagRoutes)

// Contact: rate-limited but no auth required (reporter flow)
app.use('/contact/*', rateLimitMiddleware)
app.route('/contact', contactRoutes)

// Admin: API-key protected tag generation (internal tooling)
app.route('/admin', adminRoutes)

// ── Authenticated Routes ──────────────────────────────────────────────────────
app.use('/vehicles/*', authMiddleware)
app.route('/vehicles', vehicleRoutes)

app.use('/dashboard', authMiddleware)
app.use('/dashboard/*', authMiddleware)
app.route('/dashboard', dashboardRoutes)

app.use('/profile', authMiddleware)
app.route('/profile', profileRoutes)

// ── 404 Handler ───────────────────────────────────────────────────────────────
app.notFound(c => c.json({ error: 'Not found' }, 404))

// ── Error Handler ─────────────────────────────────────────────────────────────
app.onError((err, c) => {
  // Log sanitised error — never include request body or PII
  console.error('[api] Unhandled error:', err)

return c.json(
  {
    error: err instanceof Error ? err.message : String(err),
  },
  500
)
  
})

export default app
