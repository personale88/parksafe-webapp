/**
 * Contact event audit log and report queries.
 */

import { desc, eq, inArray, sql } from 'drizzle-orm'
import { contactEvents, tags, vehicles } from '@parksafe/db'
import type { ChannelType, IssueType } from '@parksafe/types'
import { getDb } from '../lib/db'

export interface InsertContactEventInput {
  tagId: string
  vehicleId?: string
  reporterSessionHash: string
  reporterUserId?: string
  issueType: IssueType
  channel: ChannelType
  customNote?: string
  relaySuccess: boolean
}

export interface ContactEventWithVehicleRow {
  id: string
  issueType: string
  channel: string
  createdAt: Date
  vehicleMake: string | null
  vehicleModel: string | null
  vehicleColour: string | null
  vehiclePlatePartial: string | null
  vehiclePlateEncrypted: string | null
}

export async function insertContactEvent(input: InsertContactEventInput): Promise<void> {
  const db = getDb()
  if (!db) return

  await db.insert(contactEvents).values({
    tagId: input.tagId,
    vehicleId: input.vehicleId ?? null,
    reporterSessionHash: input.reporterSessionHash,
    reporterUserId: input.reporterUserId ?? null,
    issueType: input.issueType,
    channel: input.channel,
    customNote: input.customNote ?? null,
    relayStatus: input.relaySuccess ? 'DELIVERED' : 'FAILED',
  })
}

export async function countEventsForTags(tagIds: string[]): Promise<number> {
  const db = getDb()
  if (!db || tagIds.length === 0) return 0

  const result = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(contactEvents)
    .where(inArray(contactEvents.tagId, tagIds))

  return result[0]?.count ?? 0
}

export async function findLatestEventForTags(tagIds: string[]): Promise<Date | null> {
  const db = getDb()
  if (!db || tagIds.length === 0) return null

  const rows = await db
    .select({ createdAt: contactEvents.createdAt })
    .from(contactEvents)
    .where(inArray(contactEvents.tagId, tagIds))
    .orderBy(desc(contactEvents.createdAt))
    .limit(1)

  return rows[0]?.createdAt ?? null
}

async function queryEventsWithVehicles(
  whereClause: ReturnType<typeof eq> | ReturnType<typeof inArray>,
  limit?: number
): Promise<ContactEventWithVehicleRow[]> {
  const db = getDb()
  if (!db) return []

  let query = db
    .select({
      id: contactEvents.id,
      issueType: contactEvents.issueType,
      channel: contactEvents.channel,
      createdAt: contactEvents.createdAt,
      vehicleMake: vehicles.make,
      vehicleModel: vehicles.model,
      vehicleColour: vehicles.colour,
      vehiclePlatePartial: vehicles.platePartial,
      vehiclePlateEncrypted: vehicles.plateEncrypted,
    })
    .from(contactEvents)
    .leftJoin(tags, eq(contactEvents.tagId, tags.id))
    .leftJoin(vehicles, eq(tags.vehicleId, vehicles.id))
    .where(whereClause)
    .orderBy(desc(contactEvents.createdAt))

  if (limit !== undefined) {
    query = query.limit(limit) as typeof query
  }

  const rows = await query
  return rows
}

export async function listReceivedEvents(
  tagIds: string[],
  limit = 10
): Promise<ContactEventWithVehicleRow[]> {
  if (tagIds.length === 0) return []
  return queryEventsWithVehicles(inArray(contactEvents.tagId, tagIds), limit)
}

export async function listSentEvents(reporterUserId: string): Promise<ContactEventWithVehicleRow[]> {
  return queryEventsWithVehicles(eq(contactEvents.reporterUserId, reporterUserId), 50)
}

export async function countSentEvents(reporterUserId: string): Promise<number> {
  const db = getDb()
  if (!db) return 0

  const result = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(contactEvents)
    .where(eq(contactEvents.reporterUserId, reporterUserId))

  return result[0]?.count ?? 0
}
