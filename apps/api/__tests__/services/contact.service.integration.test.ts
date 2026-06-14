import { describe, it, expect, vi, beforeAll, afterAll, beforeEach } from 'vitest'
import {
  setupIntegrationDb,
  teardownIntegrationDb,
  truncateAllTables,
} from '../helpers/integration-db'
import { createUser } from '../../src/repositories/users.repository'
import { insertVehicle } from '../../src/repositories/vehicles.repository'
import { getDb } from '../../src/lib/db'
import { tags } from '@parksafe/db'

vi.mock('../../src/services/relay.service', () => ({
  dispatchRelay: vi.fn().mockResolvedValue({ success: true, providerMessageId: 'msg-1' }),
}))

vi.mock('../../src/types/env', async importOriginal => {
  const actual = await importOriginal<typeof import('../../src/types/env')>()
  return {
    ...actual,
    isOtpDevMode: false,
  }
})

const { processContactRequest } = await import('../../src/services/contact.service')

describe('contact.service integration', () => {
  let tagCode: string

  beforeAll(async () => {
    await setupIntegrationDb()
  })

  afterAll(async () => {
    await teardownIntegrationDb()
  })

  beforeEach(async () => {
    await truncateAllTables()
    tagCode = 'active-contact-tag-01'

    const user = await createUser({
      displayName: 'Owner',
      phoneE164: '+919876543210',
    })
    const vehicle = await insertVehicle(user.id, {
      make: 'Maruti',
      model: 'Swift',
      colour: 'White',
      plate: 'MH12AB1234',
    })

    const db = getDb()
    if (db) {
      await db.insert(tags).values({
        tagCode,
        ownerId: user.id,
        vehicleId: vehicle.id,
        status: 'ACTIVE',
        notifyWhatsapp: true,
        callEnabled: false,
      })
    }
  })

  it('relays contact for active tag with owner phone', async () => {
    const result = await processContactRequest({
      tagId: tagCode,
      issueType: 'WRONG_PARKING',
      channel: 'WHATSAPP',
      sessionId: 'test-session-id',
    })

    expect(result.success).toBe(true)
    expect(result.messageId).toBeTruthy()
  })

  it('returns 404 for unknown tag', async () => {
    const result = await processContactRequest({
      tagId: 'nonexistent-tag',
      issueType: 'WRONG_PARKING',
      channel: 'WHATSAPP',
      sessionId: 'test-session',
    })
    expect(result.success).toBe(false)
    expect(result.status).toBe(404)
  })

  it('returns 400 when channel disabled', async () => {
    const result = await processContactRequest({
      tagId: tagCode,
      issueType: 'WRONG_PARKING',
      channel: 'CALL',
      sessionId: 'test-session',
    })
    expect(result.success).toBe(false)
    expect(result.status).toBe(400)
  })
})
