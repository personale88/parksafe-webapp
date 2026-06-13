/**
 * Vehicle CRUD business logic.
 */

import { isOtpDevMode } from '../types/env'
import type { CreateVehicleInput, Vehicle } from '@parksafe/types'
import {
  addDevVehicle,
  deactivateDevVehicle,
  getDevVehicles,
} from './dev-store'
import { createDevVehicle } from './dev-registration'
import {
  decryptVehiclePlate,
  insertVehicle,
  listVehiclesByOwner,
  softDeleteVehicle,
} from '../repositories/vehicles.repository'
import { getDb } from '../lib/db'

function mapVehicleRow(
  row: {
    id: string
    make: string
    model: string
    colour: string
    plateEncrypted: string
    platePartial: string
    isActive: boolean
  },
  includePlate: boolean
): Vehicle {
  const plate = includePlate ? decryptVehiclePlate(row.plateEncrypted) : null
  return {
    id: row.id,
    make: row.make,
    model: row.model,
    colour: row.colour,
    platePartial: row.platePartial,
    isActive: row.isActive,
    ...(plate ? { plate } : {}),
  }
}

export async function getVehiclesByOwner(ownerId: string): Promise<Vehicle[]> {
  if (isOtpDevMode && !getDb()) {
    return getDevVehicles(ownerId).filter(v => v.isActive)
  }

  const rows = await listVehiclesByOwner(ownerId)
  return rows.map(r => mapVehicleRow(r, true))
}

export async function createVehicle(
  ownerId: string,
  input: CreateVehicleInput
): Promise<{ success: boolean; vehicle?: Vehicle; error?: string }> {
  if (isOtpDevMode && !getDb()) {
    const vehicle = createDevVehicle(ownerId, input)
    addDevVehicle(ownerId, input, vehicle)
    return { success: true, vehicle }
  }

  try {
    const row = await insertVehicle(ownerId, input)
    return { success: true, vehicle: mapVehicleRow(row, true) }
  } catch (err) {
    console.error('[vehicle.service] Create failed:', err instanceof Error ? err.message : err)
    return { success: false, error: 'Failed to create vehicle' }
  }
}

export async function deleteVehicle(
  vehicleId: string,
  ownerId: string
): Promise<{ success: boolean; error?: string }> {
  if (isOtpDevMode && !getDb()) {
    const ok = deactivateDevVehicle(ownerId, vehicleId)
    return ok ? { success: true } : { success: false, error: 'Vehicle not found' }
  }

  const ok = await softDeleteVehicle(vehicleId, ownerId)
  return ok ? { success: true } : { success: false, error: 'Vehicle not found' }
}

export async function decryptPlate(plateEncrypted: string): Promise<string | null> {
  return decryptVehiclePlate(plateEncrypted)
}
