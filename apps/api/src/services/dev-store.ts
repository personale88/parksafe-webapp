/**
 * In-memory store for OTP dev mode — vehicles, profile, and dashboard stats.
 */

import type {
  ContactEventSummary,
  CreateVehicleInput,
  ReportedVehicleEvent,
  UserSettings,
  Vehicle,
} from '@parksafe/types'

interface DevProfile {
  displayName: string
  email: string | null
  createdAt: Date
}

const profiles = new Map<string, DevProfile>()
/** E.164 phone → owner id — used for sign-in lookup in dev mode. */
const ownerIdByPhone = new Map<string, string>()
const vehiclesByOwner = new Map<string, Vehicle[]>()
const reportedByUser = new Map<string, number>()
const settingsByUser = new Map<string, UserSettings>()
const receivedByOwner = new Map<string, ContactEventSummary[]>()
const sentByReporter = new Map<string, ReportedVehicleEvent[]>()

const DEFAULT_SETTINGS: UserSettings = {
  notifyWhatsapp: true,
  marketingEmails: false,
}

export function setDevProfile(userId: string, displayName: string): void {
  if (!profiles.has(userId)) {
    profiles.set(userId, { displayName, email: null, createdAt: new Date() })
  }
}

/** Force-set a full profile — used by dev seed to back-date createdAt. */
export function seedDevProfile(
  userId: string,
  profile: { displayName: string; email: string | null; createdAt: Date }
): void {
  profiles.set(userId, profile)
}

/** Force-set reported count — used by dev seed. */
export function setDevReportedCount(userId: string, count: number): void {
  reportedByUser.set(userId, count)
}

/** Force-set vehicles list — used by dev seed. */
export function setDevVehicles(ownerId: string, vehicles: Vehicle[]): void {
  vehiclesByOwner.set(ownerId, vehicles)
}

export function getDevProfile(userId: string): DevProfile | undefined {
  return profiles.get(userId)
}

export function updateDevProfile(
  userId: string,
  updates: { displayName?: string; email?: string | null }
): DevProfile {
  const existing = profiles.get(userId) ?? {
    displayName: 'Driver',
    email: null,
    createdAt: new Date(),
  }
  const next = {
    ...existing,
    displayName: updates.displayName ?? existing.displayName,
    email: updates.email !== undefined ? updates.email : existing.email,
  }
  profiles.set(userId, next)
  return next
}

export function addDevVehicle(ownerId: string, input: CreateVehicleInput, vehicle: Vehicle): void {
  setDevProfile(ownerId, 'Driver')
  const list = vehiclesByOwner.get(ownerId) ?? []
  vehiclesByOwner.set(ownerId, [vehicle, ...list])
}

export function getDevVehicles(ownerId: string): Vehicle[] {
  return vehiclesByOwner.get(ownerId) ?? []
}

export function deactivateDevVehicle(ownerId: string, vehicleId: string): boolean {
  const list = vehiclesByOwner.get(ownerId) ?? []
  let found = false
  const next = list.map(v => {
    if (v.id !== vehicleId) return v
    found = true
    return { ...v, isActive: false }
  })
  if (found) vehiclesByOwner.set(ownerId, next)
  return found
}

/** @deprecated Use deactivateDevVehicle — kept for internal callers during migration */
export function removeDevVehicle(ownerId: string, vehicleId: string): boolean {
  return deactivateDevVehicle(ownerId, vehicleId)
}

export function incrementDevReports(userId: string): void {
  reportedByUser.set(userId, (reportedByUser.get(userId) ?? 0) + 1)
}

export function getDevReportedCount(userId: string): number {
  const sent = sentByReporter.get(userId)
  if (sent) return sent.length
  return reportedByUser.get(userId) ?? 0
}

export function setDevReportsReceived(userId: string, events: ContactEventSummary[]): void {
  receivedByOwner.set(userId, events)
}

export function setDevReportsSent(userId: string, events: ReportedVehicleEvent[]): void {
  sentByReporter.set(userId, events)
  reportedByUser.set(userId, events.length)
}

export function getDevReportsReceived(userId: string): ContactEventSummary[] {
  return receivedByOwner.get(userId) ?? []
}

export function getDevReportsSent(userId: string): ReportedVehicleEvent[] {
  return sentByReporter.get(userId) ?? []
}

export function getDevSettings(userId: string): UserSettings {
  return settingsByUser.get(userId) ?? DEFAULT_SETTINGS
}

export function updateDevSettings(userId: string, settings: UserSettings): UserSettings {
  settingsByUser.set(userId, settings)
  return settings
}

export function linkDevPhone(phoneE164: string, userId: string): void {
  ownerIdByPhone.set(phoneE164, userId)
}

export function findDevUserIdByPhone(phoneE164: string): string | undefined {
  return ownerIdByPhone.get(phoneE164)
}
