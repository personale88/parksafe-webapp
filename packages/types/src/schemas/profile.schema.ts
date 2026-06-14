import { z } from 'zod'

export const UserProfileSchema = z.object({
  id: z.string().uuid(),
  displayName: z.string().min(1).max(80),
  email: z.string().email().nullable().optional(),
})

export const UpdateProfileSchema = z.object({
  displayName: z.string().min(1).max(80).optional(),
  email: z.string().email().nullable().optional(),
})

export const UserSettingsSchema = z.object({
  notifyWhatsapp: z.boolean(),
  marketingEmails: z.boolean(),
})

export const UpdateSettingsSchema = z.object({
  notifyWhatsapp: z.boolean().optional(),
  marketingEmails: z.boolean().optional(),
})

export type UserProfile = z.infer<typeof UserProfileSchema>
export type UpdateProfileInput = z.infer<typeof UpdateProfileSchema>
export type UserSettings = z.infer<typeof UserSettingsSchema>
export type UpdateSettingsInput = z.infer<typeof UpdateSettingsSchema>
