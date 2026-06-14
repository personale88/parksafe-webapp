/**
 * packages/db/src/seed.ts
 * Development seed — populates the DB with safe mock data for local testing.
 *
 * PRIVACY RULE: NO real PII ever. All data is fictional.
 */

import crypto from 'node:crypto'
import { count } from 'drizzle-orm'
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import { resolveDatabaseUrl } from './load-env'
import * as schema from './schema'

const OWNER_ID = '00000000-0000-0000-0000-000000000010'
const VEHICLE_1 = '00000000-0000-0000-0000-000000000001'
const VEHICLE_2 = '00000000-0000-0000-0000-000000000002'
const TAG_ACTIVE = '00000000-0000-0000-0000-000000000101'
const TAG_INACTIVE = '00000000-0000-0000-0000-000000000102'

/** Known tag code for contact flow E2E — matches DEV_CONTACT_PREVIEW fallback */
export const SEED_TAG_CODE = 'test-tag-uuid-001'

/**
 * Deterministic placeholder encryption for seed data only.
 * Production uses PII_ENCRYPTION_KEY via apps/api pii-crypto.
 */
function seedEncrypt(value: string): string {
  return `SEED_ENC:${Buffer.from(value).toString('base64')}`
}

function seedPhoneHash(phone: string): string {
  const secret = process.env['OTP_HMAC_SECRET'] ?? 'dev-only-otp-hmac-secret-32chars-min'
  return crypto.createHmac('sha256', secret).update(phone).digest('hex')
}

const databaseUrl = resolveDatabaseUrl()
if (!databaseUrl) {
  console.error('[seed] DATABASE_URL is required — set it in the environment or apps/api/.env')
  process.exit(1)
}

const client = postgres(databaseUrl)
const db = drizzle(client, { schema })

async function seed() {
  console.log('[seed] Seeding database with mock data...')

  const ownerPhone = '+919876543210'

  await db
    .insert(schema.users)
    .values({
      id: OWNER_ID,
      displayName: 'Seed Owner',
      phoneHash: seedPhoneHash(ownerPhone),
      phoneEncrypted: seedEncrypt(ownerPhone),
      email: null,
    })
    .onConflictDoNothing()

  await db
    .insert(schema.vehicles)
    .values([
      {
        id: VEHICLE_1,
        ownerId: OWNER_ID,
        make: 'Maruti',
        model: 'Swift',
        colour: 'White',
        plateEncrypted: seedEncrypt('MH02AB0001'),
        platePartial: 'MH**0001',
        isActive: true,
      },
      {
        id: VEHICLE_2,
        ownerId: OWNER_ID,
        make: 'Hyundai',
        model: 'Creta',
        colour: 'Silver',
        plateEncrypted: seedEncrypt('KA05CD0002'),
        platePartial: 'KA**0002',
        isActive: true,
      },
    ])
    .onConflictDoNothing()

  await db
    .insert(schema.tags)
    .values([
      {
        id: TAG_ACTIVE,
        tagCode: SEED_TAG_CODE,
        vehicleId: VEHICLE_1,
        ownerId: OWNER_ID,
        status: 'ACTIVE',
        notifyWhatsapp: true,
        callEnabled: false,
        activatedAt: new Date(),
      },
      {
        id: TAG_INACTIVE,
        tagCode: 'inactive-tag-uuid',
        vehicleId: VEHICLE_2,
        ownerId: OWNER_ID,
        status: 'INACTIVE',
        notifyWhatsapp: false,
        callEnabled: false,
      },
    ])
    .onConflictDoNothing()

  await db
    .insert(schema.userSettings)
    .values({
      userId: OWNER_ID,
      notifyWhatsapp: true,
      marketingEmails: false,
    })
    .onConflictDoNothing()

  console.log('[seed] Complete.')
  console.log('')
  console.log('── Demo data (safe to use locally) ──────────────────────')
  console.log('  Owner:     Seed Owner')
  console.log('  Phone:     +919876543210  (10 digits: 9876543210)')
  console.log('  Tag code:  test-tag-uuid-001')
  console.log('  Vehicles:  Maruti Swift (active tag), Hyundai Creta')
  console.log('')
  console.log('── Flows to try ─────────────────────────────────────────')
  console.log('  Contact:   http://localhost:3000/contact/test-tag-uuid-001')
  console.log('  Sign-in:   http://localhost:3000/sign-in')
  console.log('             → enter 9876543210 → OTP printed in API terminal')
  console.log('  Dashboard: after sign-in → shows Seed Owner + 2 vehicles')
  console.log('  Admin:     http://localhost:3000/admin → inventory mock (after db:seed)')
  console.log('')
  await seedAdminBatches()
  await client.end()
}

async function seedAdminBatches() {
  const countRows = await db.select({ value: count() }).from(schema.tagBatches)
  const batchCount = countRows[0]?.value ?? 0
  if (batchCount > 0) {
    console.log('[seed] Admin batches already exist — skipping')
    return
  }

  const BATCH_IDS = [
    '10000000-0000-0000-0000-000000000001',
    '10000000-0000-0000-0000-000000000002',
    '10000000-0000-0000-0000-000000000003',
  ] as const

  const daysAgo = (n: number) => new Date(Date.now() - n * 86_400_000)

  const specs = [
    { id: BATCH_IDS[0], requestedCount: 100, soldCount: 25, age: 30 },
    { id: BATCH_IDS[1], requestedCount: 50, soldCount: 8, age: 7 },
    { id: BATCH_IDS[2], requestedCount: 75, soldCount: 0, age: 1 },
  ] as const

  console.log('[seed] Seeding admin mock batches…')

  for (const spec of specs) {
    const createdAt = daysAgo(spec.age)
    await db.insert(schema.tagBatches).values({
      id: spec.id,
      requestedCount: spec.requestedCount,
      completedCount: spec.requestedCount,
      status: 'COMPLETED',
      startedAt: createdAt,
      completedAt: createdAt,
      createdAt,
    })

    const tagRows = []
    const inactiveSold = Math.floor(spec.soldCount / 3)
    const activeSold = spec.soldCount - inactiveSold

    for (let i = 0; i < spec.requestedCount; i++) {
      let status: 'UNREGISTERED' | 'ACTIVE' | 'INACTIVE' = 'UNREGISTERED'
      if (i < activeSold) status = 'ACTIVE'
      else if (i < spec.soldCount) status = 'INACTIVE'

      tagRows.push({
        tagCode: crypto.randomUUID(),
        batchId: spec.id,
        status,
        ...(status !== 'UNREGISTERED' ? { activatedAt: createdAt } : {}),
      })
    }

    for (let i = 0; i < tagRows.length; i += 100) {
      await db.insert(schema.tags).values(tagRows.slice(i, i + 100)).onConflictDoNothing()
    }
  }

  console.log('[seed] Admin mock: 3 batches, 225 tags (192 in stock, 33 sold)')
}

seed().catch(err => {
  console.error('[seed] Failed:', err)
  process.exit(1)
})
