/**
 * packages/db/src/seed.ts
 * Development seed — populates the DB with safe mock data for local testing.
 *
 * PRIVACY RULE: NO real PII ever. All data is fictional.
 */

import crypto from 'node:crypto'
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
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

const client = postgres(process.env['DATABASE_URL'] ?? '')
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
        notifySms: true,
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
        notifySms: false,
        notifyWhatsapp: false,
        callEnabled: false,
      },
    ])
    .onConflictDoNothing()

  await db
    .insert(schema.userSettings)
    .values({
      userId: OWNER_ID,
      notifySms: true,
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
  console.log('')
  await client.end()
}

seed().catch(err => {
  console.error('[seed] Failed:', err)
  process.exit(1)
})
