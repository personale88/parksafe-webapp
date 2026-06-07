import { describe, it, expect, vi, beforeAll, afterAll, beforeEach } from 'vitest'
import {
  setupIntegrationDb,
  teardownIntegrationDb,
  truncateAllTables,
} from '../helpers/integration-db'
import { createUser } from '../../src/repositories/users.repository'
import { getDb } from '../../src/lib/db'
import { tags } from '@parksafe/db'
import { eq } from 'drizzle-orm'

vi.mock('../../src/lib/redis', () => ({
  redis: {
    get: vi.fn().mockResolvedValue('654321'),
    setex: vi.fn(),
    del: vi.fn(),
    incr: vi.fn().mockResolvedValue(1),
    ttl: vi.fn(),
    expire: vi.fn(),
  },
}))

vi.mock('../../src/types/env', async importOriginal => {
  const actual = await importOriginal<typeof import('../../src/types/env')>()
  return {
    ...actual,
    isOtpDevMode: false,
  }
})

const { registerVehicle } = await import('../../src/services/registration.service')

describe('registration.service integration', () => {
  beforeAll(async () => {
    await setupIntegrationDb()
  })

  afterAll(async () => {
    await teardownIntegrationDb()
  })

  beforeEach(async () => {
    await truncateAllTables()
    const db = getDb()
    if (db) {
      await db.insert(tags).values({
        tagCode: 'new-tag-code-001',
        status: 'UNREGISTERED',
      })
    }
  })

  it('registers a new owner and vehicle', async () => {
    const result = await registerVehicle({
      ownerName: 'Aditya',
      ownerPhone: '9876543210',
      emergencyName: 'Emergency',
      emergencyPhone: '9876543211',
      make: 'Maruti',
      model: 'Swift',
      colour: 'White',
      plate: 'MH12AB1234',
      vehicleType: 'CAR',
      whatsappEnabled: true,
      consent: true,
      otp: '654321',
      tagCode: 'new-tag-code-001',
    })

    expect(result.success).toBe(true)
    expect(result.userId).toBeTruthy()
    expect(result.accessToken).toBeTruthy()
    expect(result.refreshToken).toBeTruthy()
    expect(result.vehicle?.platePartial).toBe('MH**1234')
  })

  it('returns 409 for duplicate phone registration', async () => {
    await createUser({ displayName: 'Existing', phoneE164: '+919876543210' })

    const result = await registerVehicle({
      ownerName: 'Duplicate',
      ownerPhone: '9876543210',
      emergencyName: 'E',
      emergencyPhone: '9876543211',
      make: 'Honda',
      model: 'City',
      colour: 'Black',
      plate: 'KA01CD9999',
      vehicleType: 'CAR',
      whatsappEnabled: false,
      consent: true,
      otp: '654321',
    })

    expect(result.success).toBe(false)
    expect(result.statusCode).toBe(409)
  })
})
