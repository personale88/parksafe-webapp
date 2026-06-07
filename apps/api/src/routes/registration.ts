import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { RegisterVehicleSchema } from '@parksafe/types'
import { registerVehicle } from '../services/registration.service'

export const registrationRoutes = new Hono()

/**
 * POST /registration
 * Public — verifies OTP, creates owner account, vehicle, and optionally activates a tag.
 */
registrationRoutes.post('/', zValidator('json', RegisterVehicleSchema), async c => {
  const input = c.req.valid('json')
  const result = await registerVehicle(input)

  if (!result.success) {
    const status = (result.statusCode ?? (result.error?.includes('locked') ? 429 : 400)) as
      | 400
      | 409
      | 429
    return c.json({ error: result.error ?? 'Registration failed' }, status)
  }

  return c.json(
    {
      message: 'Vehicle registered successfully',
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
      userId: result.userId,
      vehicle: result.vehicle,
    },
    201
  )
})
