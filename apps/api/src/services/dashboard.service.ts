/**
 * Dashboard aggregation for authenticated owners.
 */

import { isOtpDevMode } from '../types/env'
import type { ContactEventSummary, DashboardSummary, Reward } from '@parksafe/types'
import {
  getDevProfile,
  getDevReportedCount,
  getDevReportsReceived,
  getDevVehicles,
} from './dev-store'
import { findUserById } from '../repositories/users.repository'
import { countActiveVehicles } from '../repositories/vehicles.repository'
import { listTagIdsByOwner } from '../repositories/tags.repository'
import {
  countEventsForTags,
  findLatestEventForTags,
  listReceivedEvents,
} from '../repositories/contactEvents.repository'
import { countSentEvents } from '../repositories/contactEvents.repository'
import { mapReceivedContactEvent } from './reports.service'

const MS_PER_DAY = 86_400_000

function daysBetween(start: Date, end: Date): number {
  const diff = end.getTime() - start.getTime()
  return Math.max(0, Math.floor(diff / MS_PER_DAY))
}

function computeSafeDays(accountCreatedAt: Date, lastContactAt: Date | null): number {
  const now = new Date()
  if (!lastContactAt) {
    return Math.min(999, daysBetween(accountCreatedAt, now))
  }
  return Math.min(999, daysBetween(lastContactAt, now))
}

function buildRewards(
  safeDays: number,
  reportsReceived: number,
  vehiclesReported: number
): Reward[] {
  return [
    {
      id: 'streak-30',
      title: 'Monthly champion',
      description: '30 safe driving days in a row',
      unlocked: safeDays >= 30,
      progress: Math.min(100, Math.round((safeDays / 30) * 100)),
    },
    {
      id: 'zero-reports',
      title: 'Clean record',
      description: 'No alerts received on your vehicles',
      unlocked: reportsReceived === 0,
      progress: reportsReceived === 0 ? 100 : Math.max(0, 100 - reportsReceived * 10),
    },
    {
      id: 'community-helper',
      title: 'Community helper',
      description: 'Sent alerts for 5+ vehicles',
      unlocked: vehiclesReported >= 5,
      progress: Math.min(100, Math.round((vehiclesReported / 5) * 100)),
    },
    {
      id: 'parking-guardian',
      title: 'Parking guardian',
      description: '90+ days of safe driving',
      unlocked: safeDays >= 90,
      progress: Math.min(100, Math.round((safeDays / 90) * 100)),
    },
  ]
}

async function getDashboardFromDb(userId: string, fallbackName: string): Promise<DashboardSummary> {
  const user = await findUserById(userId)
  const displayName = user?.displayName ?? fallbackName
  const accountCreatedAt = user?.createdAt ?? new Date()

  const activeVehicles = await countActiveVehicles(userId)
  const tagIds = await listTagIdsByOwner(userId)

  let reportsReceived = 0
  let lastContactAt: Date | null = null
  let recentContacts: ContactEventSummary[] = []

  if (tagIds.length > 0) {
    reportsReceived = await countEventsForTags(tagIds)
    lastContactAt = await findLatestEventForTags(tagIds)
    const events = await listReceivedEvents(tagIds, 10)
    recentContacts = await Promise.all(events.map(mapReceivedContactEvent))
  }

  const vehiclesReported = await countSentEvents(userId)
  const safeDays = computeSafeDays(accountCreatedAt, lastContactAt)
  const rewards = buildRewards(safeDays, reportsReceived, vehiclesReported)

  return {
    displayName,
    activeVehicles,
    safeDays,
    reportsReceived,
    vehiclesReported,
    rewards,
    recentContacts,
  }
}

export async function getDashboardSummary(userId: string): Promise<DashboardSummary> {
  const fallbackName = 'Driver'

  if (isOtpDevMode) {
    const dbUser = await findUserById(userId)
    if (dbUser) {
      return getDashboardFromDb(userId, fallbackName)
    }
    const profile = getDevProfile(userId)
    const devVehicles = getDevVehicles(userId).filter(v => v.isActive)
    const safeDays = profile
      ? Math.min(999, daysBetween(profile.createdAt, new Date()))
      : 0
    const vehiclesReported = getDevReportedCount(userId)
    const reportsReceived = getDevReportsReceived(userId).length
    return {
      displayName: profile?.displayName ?? fallbackName,
      activeVehicles: devVehicles.length,
      safeDays,
      reportsReceived,
      vehiclesReported,
      rewards: buildRewards(safeDays, reportsReceived, vehiclesReported),
      recentContacts: [],
    }
  }

  return getDashboardFromDb(userId, fallbackName)
}
