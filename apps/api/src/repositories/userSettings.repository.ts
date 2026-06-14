/**
 * Account-level notification preferences.
 */

import { eq } from 'drizzle-orm'
import { userSettings } from '@parksafe/db'
import type { UserSettings } from '@parksafe/types'
import { getDb } from '../lib/db'

const DEFAULT_SETTINGS: UserSettings = {
  notifyWhatsapp: true,
  marketingEmails: false,
}

export async function getSettings(userId: string): Promise<UserSettings> {
  const db = getDb()
  if (!db) return DEFAULT_SETTINGS

  const rows = await db
    .select()
    .from(userSettings)
    .where(eq(userSettings.userId, userId))
    .limit(1)

  const row = rows[0]
  if (!row) return DEFAULT_SETTINGS

  return {
    notifyWhatsapp: row.notifyWhatsapp,
    marketingEmails: row.marketingEmails,
  }
}

export async function upsertSettings(userId: string, settings: UserSettings): Promise<UserSettings> {
  const db = getDb()
  if (!db) return settings

  const rows = await db
    .insert(userSettings)
    .values({
      userId,
      notifyWhatsapp: settings.notifyWhatsapp,
      marketingEmails: settings.marketingEmails,
    })
    .onConflictDoUpdate({
      target: userSettings.userId,
      set: {
        notifyWhatsapp: settings.notifyWhatsapp,
        marketingEmails: settings.marketingEmails,
        updatedAt: new Date(),
      },
    })
    .returning()

  const row = rows[0]
  if (!row) return settings

  return {
    notifyWhatsapp: row.notifyWhatsapp,
    marketingEmails: row.marketingEmails,
  }
}
