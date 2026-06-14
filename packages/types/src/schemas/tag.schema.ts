import { z } from 'zod'
import { VehicleSchema } from './vehicle.schema'

export const TagStatusSchema = z.enum(['UNREGISTERED', 'ACTIVE', 'INACTIVE'])

/** Public tag info returned to reporters after QR scan — no owner identity. */
export const TagInfoSchema = z.object({
  tagId: z.string().uuid(),
  status: TagStatusSchema,
  vehicle: VehicleSchema.pick({ make: true, model: true, colour: true, platePartial: true }),
  /** Which channels the owner has enabled for this tag */
  availableChannels: z.array(z.enum(['WHATSAPP', 'CALL'])),
})

export const UpdateTagSchema = z.object({
  notifyWhatsapp: z.boolean().optional(),
  callEnabled: z.boolean().optional(),
  status: TagStatusSchema.exclude(['UNREGISTERED']).optional(),
})

export type TagStatus = z.infer<typeof TagStatusSchema>
export type TagInfo = z.infer<typeof TagInfoSchema>
export type UpdateTagInput = z.infer<typeof UpdateTagSchema>
