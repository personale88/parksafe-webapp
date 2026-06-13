/**
 * QR tag data access.
 */

import { and, eq } from 'drizzle-orm'
import { tags, vehicles } from '@parksafe/db'
import { getDb } from '../lib/db'

export interface TagWithVehicleRow {
  id: string
  tagCode: string
 status: 'UNREGISTERED' | 'ACTIVE' | 'INACTIVE'
  ownerId: string | null
  vehicleId: string | null
  notifySms: boolean
  notifyWhatsapp: boolean
  callEnabled: boolean
  vehicleMake: string | null
  vehicleModel: string | null
  vehicleColour: string | null
  vehiclePlatePartial: string | null
}

export async function findTagByCode(tagCode: string): Promise<TagWithVehicleRow | null> {
  const db = getDb()
  if (!db) return null

  const rows = await db
    .select({
      id: tags.id,
      tagCode: tags.tagCode,
      status: tags.status,
      ownerId: tags.ownerId,
      vehicleId: tags.vehicleId,
      notifySms: tags.notifySms,
      notifyWhatsapp: tags.notifyWhatsapp,
      callEnabled: tags.callEnabled,
      vehicleMake: vehicles.make,
      vehicleModel: vehicles.model,
      vehicleColour: vehicles.colour,
      vehiclePlatePartial: vehicles.platePartial,
    })
    .from(tags)
    .leftJoin(vehicles, eq(tags.vehicleId, vehicles.id))
    .where(eq(tags.tagCode, tagCode))
    .limit(1)

  const row = rows[0]
  return row ?? null
}

export async function findTagById(tagId: string): Promise<TagWithVehicleRow | null> {
  const db = getDb()
  if (!db) return null

  const rows = await db
    .select({
      id: tags.id,
      tagCode: tags.tagCode,
      status: tags.status,
      ownerId: tags.ownerId,
      vehicleId: tags.vehicleId,
      notifySms: tags.notifySms,
      notifyWhatsapp: tags.notifyWhatsapp,
      callEnabled: tags.callEnabled,
      vehicleMake: vehicles.make,
      vehicleModel: vehicles.model,
      vehicleColour: vehicles.colour,
      vehiclePlatePartial: vehicles.platePartial,
    })
    .from(tags)
    .leftJoin(vehicles, eq(tags.vehicleId, vehicles.id))
    .where(eq(tags.id, tagId))
    .limit(1)

  const row = rows[0]
  return row ?? null
}

export async function listTagIdsByOwner(ownerId: string): Promise<string[]> {
  const db = getDb()
  if (!db) return []

  const rows = await db.select({ id: tags.id }).from(tags).where(eq(tags.ownerId, ownerId))
  return rows.map(r => r.id)
}

export async function updateTagPreferences(
  tagId: string,
  ownerId: string,
  updates: {
    notifySms?: boolean
    notifyWhatsapp?: boolean
    callEnabled?: boolean
    status?: 'UNREGISTERED' | 'ACTIVE' | 'INACTIVE'
  }
): Promise<boolean> {
  const db = getDb()
  if (!db) return false

  const set: Record<string, unknown> = { updatedAt: new Date() }
  if (updates.notifySms !== undefined) set['notifySms'] = updates.notifySms
  if (updates.notifyWhatsapp !== undefined) set['notifyWhatsapp'] = updates.notifyWhatsapp
  if (updates.callEnabled !== undefined) set['callEnabled'] = updates.callEnabled
  if (updates.status !== undefined) set['status'] = updates.status

  const rows = await db
    .update(tags)
    .set(set)
    .where(and(eq(tags.id, tagId), eq(tags.ownerId, ownerId)))
    .returning({ id: tags.id })

  return rows.length > 0
}

export async function activateTag(
  tagCode: string,
  ownerId: string,
  vehicleId: string,
  whatsappEnabled: boolean
): Promise<boolean> {
  const db = getDb()
  if (!db) return false

  const rows = await db
    .update(tags)
    .set({
      ownerId,
      vehicleId,
      status: 'ACTIVE',
      notifyWhatsapp: whatsappEnabled,
      notifySms: true,
      activatedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(and(eq(tags.tagCode, tagCode), eq(tags.status, 'UNREGISTERED')))
    .returning({ id: tags.id })

  return rows.length > 0
}

export async function createTag(tagCode: string) {
  const db = getDb()
  if (!db) return null

  const rows = await db
    .insert(tags)
    .values({
      tagCode,
      status: 'UNREGISTERED' as const,
    })
    .returning()

  return rows[0] ?? null
}

export async function getAllTags() {
  const db = getDb()
  if (!db) return []

  return await db.select().from(tags)
}

export async function deleteTag(tagCode: string) {
  const db = getDb()
  if (!db) return false

  const rows = await db
    .delete(tags)
    .where(eq(tags.tagCode, tagCode))
    .returning({
      id: tags.id,
    })

  return rows.length > 0
}
export async function createBulkTags(tagCodes: string[]) {
  const db = getDb()
  if (!db) return []

  return await db
    .insert(tags)
    .values(
      tagCodes.map(tagCode => ({
        tagCode,
        status: 'UNREGISTERED' as const,
      }))
    )
    .returning()
}