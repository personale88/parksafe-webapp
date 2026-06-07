import { describe, it, expect, vi, beforeAll, afterAll, beforeEach } from 'vitest'
import {
  setupIntegrationDb,
  teardownIntegrationDb,
  truncateAllTables,
} from '../helpers/integration-db'
import { createUser } from '../../src/repositories/users.repository'

vi.mock('../../src/types/env', async importOriginal => {
  const actual = await importOriginal<typeof import('../../src/types/env')>()
  return {
    ...actual,
    isOtpDevMode: false,
  }
})

const { createVehicle, getVehiclesByOwner, deleteVehicle } = await import(
  '../../src/services/vehicle.service'
)

describe('vehicle.service integration', () => {
  let ownerId: string

  beforeAll(async () => {
    await setupIntegrationDb()
  })

  afterAll(async () => {
    await teardownIntegrationDb()
  })

  beforeEach(async () => {
    await truncateAllTables()
    const user = await createUser({
      displayName: 'Owner',
      phoneE164: '+919876543210',
    })
    ownerId = user.id
  })

  it('creates and lists vehicles for owner', async () => {
    const created = await createVehicle(ownerId, {
      make: 'Hyundai',
      model: 'Creta',
      colour: 'Black',
      plate: 'KA05CD5678',
    })
    expect(created.success).toBe(true)
    expect(created.vehicle?.plate).toBe('KA05CD5678')

    const list = await getVehiclesByOwner(ownerId)
    expect(list).toHaveLength(1)
    expect(list[0]?.platePartial).toBe('KA**5678')
  })

  it('soft-deletes vehicle for owner', async () => {
    const created = await createVehicle(ownerId, {
      make: 'Honda',
      model: 'City',
      colour: 'Silver',
      plate: 'DL01AB1234',
    })
    const vehicleId = created.vehicle?.id ?? ''
    const deleted = await deleteVehicle(vehicleId, ownerId)
    expect(deleted.success).toBe(true)

    const list = await getVehiclesByOwner(ownerId)
    expect(list).toHaveLength(0)
  })

  it('prevents deleting another owners vehicle', async () => {
    const other = await createUser({
      displayName: 'Other',
      phoneE164: '+919111111111',
    })
    const created = await createVehicle(ownerId, {
      make: 'Tata',
      model: 'Nexon',
      colour: 'Red',
      plate: 'MH14XY9999',
    })
    const deleted = await deleteVehicle(created.vehicle?.id ?? '', other.id)
    expect(deleted.success).toBe(false)
  })
})
