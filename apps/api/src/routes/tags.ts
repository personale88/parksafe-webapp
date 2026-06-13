import { exportQrZip } from '../services/export.service'
import { generateQrPng } from '../services/qr.service'
import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { UpdateTagSchema } from '@parksafe/types'

import {
  getTagByCode,
  updateTag,
  createNewTag,
  listTags,
  removeTag,
  createBulkQrTags,
} from '../services/tag.service'

import { authMiddleware } from '../middleware/auth.middleware'
export const tagRoutes = new Hono<{ Variables: { userId: string } }>()

const CreateTagSchema = z.object({
tagCode: z.string().min(1),
})
const BulkTagSchema = z.object({
  count: z.number().min(1).max(5000),
})

/**

* POST /tags
* Create a single QR tag.
  */
  tagRoutes.post('/', zValidator('json', CreateTagSchema), async c => {
  const { tagCode } = c.req.valid('json')

const result = await createNewTag(tagCode)

if (!result.success) {
return c.json(
{
error: result.error,
},
400
)
}

return c.json(result, 201)
})

/**

* GET /tags
* List all QR tags.
  */
  tagRoutes.get('/', async c => {
  const tags = await listTags()

return c.json({
tags,
})
})

/**

* GET /tags/:tagId
  */
  tagRoutes.get('/:tagId', async c => {
  const tagId = c.req.param('tagId')
  const result = await getTagByCode(tagId)

if (!result.found || !result.tag) {
return c.json({ error: 'Tag not found or not activated' }, 404)
}

return c.json(result.tag)
})

/**

* PATCH /tags/:tagId
  */
  tagRoutes.patch('/:tagId', authMiddleware, zValidator('json', UpdateTagSchema), async c => {
  const tagId = c.req.param('tagId')
  const userId = c.get('userId')
  const updates = c.req.valid('json')

const result = await updateTag(tagId, userId, updates)

if (!result.success) {
return c.json({ error: result.error ?? 'Update failed' }, 400)
}

return c.json({ success: true })
})

/**

* DELETE /tags/:tagCode
  */
  tagRoutes.delete('/:tagCode', async c => {
  const tagCode = c.req.param('tagCode')

const result = await removeTag(tagCode)

if (!result.success) {
return c.json(
{
error: 'Tag not found',
},
404
)
}

return c.json({
success: true,
})
})
/**
 * POST /tags/bulk
 * Create multiple QR tags.
 */
tagRoutes.post(
  '/bulk',
  zValidator('json', BulkTagSchema),
  async c => {
    const { count } = c.req.valid('json')

    const result = await createBulkQrTags(count)

    return c.json(result)
  }
)
tagRoutes.get('/:tagCode/qr', async c => {
  const tagCode = c.req.param('tagCode')

  const png = await generateQrPng(tagCode)

  return new Response(png, {
    headers: {
      'Content-Type': 'image/png',
    },
  })
})
tagRoutes.post('/export', async c => {
  const result = await exportQrZip()

  return c.json(result)
})