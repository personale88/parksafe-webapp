/**
 * Owner report history — received and sent alerts.
 */

import { issueLabel } from '../constants/issueLabels'
import { isOtpDevMode } from '../types/env'
import type {
  AlertVehicle,
  ContactEventSummary,
  MaskedVehicleSummary,
  ReportedVehicleEvent,
} from '@parksafe/types'
import { getDevReportsReceived, getDevReportsSent } from './dev-store'
import { decryptPlate } from './vehicle.service'
import { listTagIdsByOwner } from '../repositories/tags.repository'
import {
  listReceivedEvents,
  listSentEvents,
  type ContactEventWithVehicleRow,
} from '../repositories/contactEvents.repository'

async function mapVehicleFromEvent(
  row: ContactEventWithVehicleRow
): Promise<AlertVehicle | undefined> {
  if (!row.vehicleMake) return undefined

  const plate = row.vehiclePlateEncrypted
    ? await decryptPlate(row.vehiclePlateEncrypted)
    : null

  return {
    make: row.vehicleMake,
    model: row.vehicleModel ?? '',
    colour: row.vehicleColour ?? '',
    platePartial: row.vehiclePlatePartial ?? '',
    ...(plate ? { plate } : {}),
  }
}

async function mapReceivedRow(row: ContactEventWithVehicleRow): Promise<ContactEventSummary> {
  const vehicle = await mapVehicleFromEvent(row)
  return {
    id: row.id,
    issueType: row.issueType,
    issueLabel: issueLabel(row.issueType),
    channel: row.channel,
    createdAt: row.createdAt.toISOString(),
    ...(vehicle ? { vehicle } : {}),
  }
}

export async function mapReceivedContactEvent(
  e: ContactEventWithVehicleRow
): Promise<ContactEventSummary> {
  return mapReceivedRow(e)
}

export async function getReportsReceived(userId: string): Promise<ContactEventSummary[]> {
  if (isOtpDevMode) {
    return getDevReportsReceived(userId)
  }

  const tagIds = await listTagIdsByOwner(userId)
  if (tagIds.length === 0) return []

  const events = await listReceivedEvents(tagIds, 50)
  return Promise.all(events.map(mapReceivedRow))
}

export async function getReportsSent(userId: string): Promise<ReportedVehicleEvent[]> {
  if (isOtpDevMode) {
    return getDevReportsSent(userId)
  }

  const events = await listSentEvents(userId)

  return events
    .filter(e => e.vehicleMake)
    .map(e => {
      const summary: MaskedVehicleSummary = {
        make: e.vehicleMake ?? '',
        model: e.vehicleModel ?? '',
        colour: e.vehicleColour ?? '',
        platePartial: e.vehiclePlatePartial ?? '',
      }

      return {
        id: e.id,
        issueType: e.issueType,
        issueLabel: issueLabel(e.issueType),
        channel: e.channel,
        createdAt: e.createdAt.toISOString(),
        vehicle: summary,
      }
    })
}
