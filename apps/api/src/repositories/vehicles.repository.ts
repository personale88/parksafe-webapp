/**
 * Vehicle data access — ownership enforced on every mutation.
 */

import { and, desc, eq } from 'drizzle-orm'
import { vehicles } from '@parksafe/db'
import { getDb } from '../lib/db'
import { encryptPii, decryptPii } from '../lib/pii-crypto'

export interface VehicleRow {
  id: string
  ownerId: string
  make: string
  model: string
  colour: string
  plateEncrypted: string
  platePartial: string
  isActive: boolean
  createdAt: Date
}

function maskPlate(plate: string): string {
  if (plate.length < 6) return '****'
  return `${plate.slice(0, 2)}**${plate.slice(-4)}`
}

export async function listVehiclesByOwner(ownerId: string): Promise<VehicleRow[]> {
  const db = getDb()
  if (!db) return []

  return db
    .select()
    .from(vehicles)
    .where(and(eq(vehicles.ownerId, ownerId), eq(vehicles.isActive, true)))
    .orderBy(desc(vehicles.createdAt))
}

export async function insertVehicle(
  ownerId: string,
  input: { make: string; model: string; colour: string; plate: string }
): Promise<VehicleRow> {
  const db = getDb()
  if (!db) throw new Error('Database not available')

  const rows = await db
    .insert(vehicles)
    .values({
      ownerId,
      make: input.make,
      model: input.model,
      colour: input.colour,
      plateEncrypted: encryptPii(input.plate),
      platePartial: maskPlate(input.plate),
      isActive: true,
    })
    .returning()

  const row = rows[0]
  if (!row) throw new Error('Failed to create vehicle')
  return row
}

export async function softDeleteVehicle(vehicleId: string, ownerId: string): Promise<boolean> {
  const db = getDb()
  if (!db) return false

  const rows = await db
    .update(vehicles)
    .set({ isActive: false })
    .where(and(eq(vehicles.id, vehicleId), eq(vehicles.ownerId, ownerId)))
    .returning({ id: vehicles.id })

  return rows.length > 0
}

export async function countActiveVehicles(ownerId: string): Promise<number> {
  const db = getDb()
  if (!db) return 0

  const rows = await db
    .select({ id: vehicles.id })
    .from(vehicles)
    .where(and(eq(vehicles.ownerId, ownerId), eq(vehicles.isActive, true)))

  return rows.length
}

/** Decrypts plate for owner-facing responses only. */
export function decryptVehiclePlate(plateEncrypted: string): string | null {
  return decryptPii(plateEncrypted)
}
