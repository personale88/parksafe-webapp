/**
 * packages/db/src/schema.ts
 * Drizzle ORM schema — ParkSafe v1.0
 *
 * All tables, relations, and constraints are defined here.
 * Migrations are generated from this file — never edit migrations manually.
 * PII rules: phone numbers stored as HMAC hashes, plates stored encrypted.
 */

import {
  pgTable,
  uuid,
  text,
  boolean,
  timestamp,
  integer,
  pgEnum,
  index,
  uniqueIndex,
} from 'drizzle-orm/pg-core'

// ── Enums ─────────────────────────────────────────────────────────────────────

export const channelTypeEnum = pgEnum('channel_type', ['SMS', 'WHATSAPP', 'CALL'])

export const issueTypeEnum = pgEnum('issue_type', [
  'BLOCKING_VEHICLE',
  'WRONG_PARKING',
  'LIGHTS_ON',
  'DOOR_OPEN',
  'FLAT_TYRE',
  'FLUID_LEAKING',
  'VEHICLE_DAMAGE',
  'EMERGENCY',
])

export const tagStatusEnum = pgEnum('tag_status', ['UNREGISTERED', 'ACTIVE', 'INACTIVE'])

export const tagBatchStatusEnum = pgEnum('tag_batch_status', [
  'PENDING',
  'PROCESSING',
  'COMPLETED',
  'FAILED',
])

export const relayStatusEnum = pgEnum('relay_status', ['PENDING', 'DELIVERED', 'FAILED'])

// ── Users ─────────────────────────────────────────────────────────────────────
// App-owned user profiles. Auth sessions are separate (auth_sessions table).
// Phone is never stored raw — HMAC hash for lookups, encrypted blob for relay.
export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  displayName: text('display_name').notNull(),
  /** HMAC(phone, secret) — enables login lookup without exposing raw number */
  phoneHash: text('phone_hash').notNull().unique(),
  /** AES-256-GCM encrypted E.164 phone — server-only, never returned to clients */
  phoneEncrypted: text('phone_encrypted'),
  /** Optional email for account recovery */
  email: text('email'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

// ── Auth Sessions (refresh token rotation) ────────────────────────────────────
export const authSessions = pgTable(
  'auth_sessions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    refreshTokenHash: text('refresh_token_hash').notNull(),
    familyId: uuid('family_id').notNull(),
    expiresAt: timestamp('expires_at').notNull(),
    revokedAt: timestamp('revoked_at'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  t => ({
    userIdx: index('auth_sessions_user_idx').on(t.userId),
    refreshHashIdx: index('auth_sessions_refresh_hash_idx').on(t.refreshTokenHash),
    familyIdx: index('auth_sessions_family_idx').on(t.familyId),
  })
)

// ── Vehicles ──────────────────────────────────────────────────────────────────
export const vehicles = pgTable(
  'vehicles',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    ownerId: uuid('owner_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    make: text('make').notNull(),
    model: text('model').notNull(),
    colour: text('colour').notNull(),
    /** Full plate encrypted at rest — never returned to non-owner clients */
    plateEncrypted: text('plate_encrypted').notNull(),
    /** e.g. "MH**1234" — safe to show reporters; generated at write time */
    platePartial: text('plate_partial').notNull(),
    isActive: boolean('is_active').default(true).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  t => ({
    ownerIdx: index('vehicles_owner_idx').on(t.ownerId),
  })
)

// ── Tag Batches (Admin QR generation jobs) ────────────────────────────────────
export const tagBatches = pgTable(
  'tag_batches',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    requestedCount: integer('requested_count').notNull(),
    completedCount: integer('completed_count').default(0).notNull(),
    status: tagBatchStatusEnum('status').default('PENDING').notNull(),
    errorMessage: text('error_message'),
    startedAt: timestamp('started_at'),
    completedAt: timestamp('completed_at'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  t => ({
    statusIdx: index('tag_batches_status_idx').on(t.status),
    createdAtIdx: index('tag_batches_created_at_idx').on(t.createdAt),
  })
)

// ── Tags (QR Stickers) ────────────────────────────────────────────────────────
export const tags = pgTable(
  'tags',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    /** UUID printed inside the QR code — the only thing exposed publicly */
    tagCode: text('tag_code').notNull().unique(),
    /** Set when created via admin bulk generation */
    batchId: uuid('batch_id').references(() => tagBatches.id, { onDelete: 'set null' }),
    vehicleId: uuid('vehicle_id').references(() => vehicles.id, { onDelete: 'set null' }),
    ownerId: uuid('owner_id').references(() => users.id, { onDelete: 'set null' }),
    status: tagStatusEnum('status').default('UNREGISTERED').notNull(),
    /** Per-tag notification preferences — owner controls each independently */
    notifyWhatsapp: boolean('notify_whatsapp').default(true).notNull(),
    /** Call relay is opt-in — disabled by default for privacy */
    callEnabled: boolean('call_enabled').default(false).notNull(),
    activatedAt: timestamp('activated_at'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  t => ({
    tagCodeIdx: uniqueIndex('tags_tag_code_idx').on(t.tagCode),
    batchIdx: index('tags_batch_idx').on(t.batchId),
    vehicleIdx: index('tags_vehicle_idx').on(t.vehicleId),
    ownerIdx: index('tags_owner_idx').on(t.ownerId),
  })
)

// ── Contact Events (Audit Log) ────────────────────────────────────────────────
// Reporter PII is NEVER stored — only a hashed session identifier.
// This table exists for rate limiting reference and owner history view.
export const contactEvents = pgTable(
  'contact_events',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tagId: uuid('tag_id')
      .notNull()
      .references(() => tags.id),
    vehicleId: uuid('vehicle_id').references(() => vehicles.id),
    /** HMAC of reporter session ID — enables abuse detection without storing identity */
    reporterSessionHash: text('reporter_session_hash').notNull(),
    /** Set when reporter is logged in — enables "vehicles you reported" without storing phone */
    reporterUserId: uuid('reporter_user_id').references(() => users.id, { onDelete: 'set null' }),
    issueType: issueTypeEnum('issue_type').notNull(),
    /** Max 140 chars, profanity-filtered before storage */
    customNote: text('custom_note'),
    channel: channelTypeEnum('channel').notNull(),
    relayStatus: relayStatusEnum('relay_status').default('PENDING').notNull(),
    ownerAcknowledged: boolean('owner_acknowledged').default(false).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  t => ({
    tagIdx: index('contact_events_tag_idx').on(t.tagId),
    sessionIdx: index('contact_events_session_idx').on(t.reporterSessionHash),
    reporterUserIdx: index('contact_events_reporter_user_idx').on(t.reporterUserId),
    createdAtIdx: index('contact_events_created_at_idx').on(t.createdAt),
  })
)

// ── User Settings (Account-level preferences) ─────────────────────────────────
export const userSettings = pgTable('user_settings', {
  userId: uuid('user_id')
    .primaryKey()
    .references(() => users.id, { onDelete: 'cascade' }),
  notifyWhatsapp: boolean('notify_whatsapp').default(true).notNull(),
  marketingEmails: boolean('marketing_emails').default(false).notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

// ── OTP Attempts (Audit Fallback) ─────────────────────────────────────────────
// Primary OTP state lives in Redis. This table is audit-only fallback.
// Enables lockout recovery if Redis experiences data loss.
export const otpAttempts = pgTable(
  'otp_attempts',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    phoneHash: text('phone_hash').notNull(),
    attemptCount: integer('attempt_count').default(0).notNull(),
    lockedUntil: timestamp('locked_until'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  t => ({
    phoneHashIdx: index('otp_attempts_phone_hash_idx').on(t.phoneHash),
  })
)
