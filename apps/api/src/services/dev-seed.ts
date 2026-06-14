/**
 * Seed data for local dev mode (OTP_DEV_MODE=true).
 * Pre-populates the in-memory store so the dashboard shows realistic data
 * the moment the API boots — no registration required.
 *
 * DEV ONLY — never imported in production builds.
 */

import crypto from 'node:crypto'
import {
  linkDevPhone,
  seedDevProfile,
  setDevReportsReceived,
  setDevReportsSent,
  setDevVehicles,
  updateDevSettings,
} from './dev-store'

/** Matches DEV_AUTH_USER_ID in apps/web/lib/auth/devSession.ts */
const DEV_USER_ID = '00000000-0000-0000-0000-000000000010'

/** Seeded owner phone for local sign-in testing (9876543210). */
export const DEV_SEED_PHONE_E164 = '+919876543210'

export function seedDevData(): void {
  linkDevPhone(DEV_SEED_PHONE_E164, DEV_USER_ID)
  // Profile — back-date createdAt so safe-day counter shows 945
  seedDevProfile(DEV_USER_ID, {
    displayName: 'Aditya Kumar',
    email: 'aditya@tribly.ai',
    createdAt: new Date(Date.now() - 945 * 86_400_000),
  })

  const swiftVehicle = {
    make: 'Maruti Suzuki',
    model: 'Swift',
    colour: 'Pearl White',
    plate: 'MH12AB1234',
    platePartial: 'MH**1234',
  }

  const cretaVehicle = {
    make: 'Hyundai',
    model: 'Creta',
    colour: 'Phantom Black',
    plate: 'KA05CD5678',
    platePartial: 'KA**5678',
  }

  // Two active vehicles
  setDevVehicles(DEV_USER_ID, [
    {
      id: crypto.randomUUID(),
      ...swiftVehicle,
      isActive: true,
    },
    {
      id: crypto.randomUUID(),
      ...cretaVehicle,
      isActive: true,
    },
  ])

  const daysAgo = (n: number) =>
    new Date(Date.now() - n * 86_400_000).toISOString()

  // Alerts received on this user's vehicles
  setDevReportsReceived(DEV_USER_ID, [
    {
      id: crypto.randomUUID(),
      issueType: 'WRONG_PARKING',
      issueLabel: 'Wrong parking',
      channel: 'WHATSAPP',
      createdAt: daysAgo(1),
      vehicle: swiftVehicle,
    },
    {
      id: crypto.randomUUID(),
      issueType: 'LIGHTS_ON',
      issueLabel: 'Lights on',
      channel: 'WHATSAPP',
      createdAt: daysAgo(3),
      vehicle: cretaVehicle,
    },
    {
      id: crypto.randomUUID(),
      issueType: 'DOOR_OPEN',
      issueLabel: 'Door open',
      channel: 'WHATSAPP',
      createdAt: daysAgo(7),
      vehicle: swiftVehicle,
    },
    {
      id: crypto.randomUUID(),
      issueType: 'BLOCKING_VEHICLE',
      issueLabel: 'Blocking vehicle',
      channel: 'CALL',
      createdAt: daysAgo(14),
      vehicle: cretaVehicle,
    },
  ])

  // Vehicles this user reported to others
  setDevReportsSent(DEV_USER_ID, [
    {
      id: crypto.randomUUID(),
      issueType: 'WRONG_PARKING',
      issueLabel: 'Wrong parking',
      channel: 'WHATSAPP',
      createdAt: daysAgo(2),
      vehicle: {
        make: 'Honda',
        model: 'City',
        colour: 'Silver',
        platePartial: 'DL**9012',
      },
    },
    {
      id: crypto.randomUUID(),
      issueType: 'BLOCKING_VEHICLE',
      issueLabel: 'Blocking vehicle',
      channel: 'WHATSAPP',
      createdAt: daysAgo(5),
      vehicle: {
        make: 'Tata',
        model: 'Nexon',
        colour: 'Red',
        platePartial: 'MH**4455',
      },
    },
    {
      id: crypto.randomUUID(),
      issueType: 'LIGHTS_ON',
      issueLabel: 'Lights on',
      channel: 'WHATSAPP',
      createdAt: daysAgo(12),
      vehicle: {
        make: 'Toyota',
        model: 'Innova',
        colour: 'White',
        platePartial: 'KA**7788',
      },
    },
  ])

  // Notification preferences
  updateDevSettings(DEV_USER_ID, {
    notifyWhatsapp: true,
    marketingEmails: false,
  })

  console.log('[dev-seed] Mock data seeded for dev user', DEV_USER_ID)
}
