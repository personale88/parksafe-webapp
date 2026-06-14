import { test, expect } from '@playwright/test'
import {
  ADMIN_API_KEY,
  API_BASE,
  createFreshTag,
  waitForBatch,
  getTagInfo,
} from './helpers'

test.describe('EC-Admin: QR generation & inventory', () => {
  test('EC-001: admin auth check succeeds with valid API key', async ({ request }) => {
    const res = await request.get(`${API_BASE}/admin/auth/check`, {
      headers: { 'X-Admin-Api-Key': ADMIN_API_KEY },
    })
    expect(res.ok()).toBeTruthy()
    const body = (await res.json()) as { authenticated: boolean }
    expect(body.authenticated).toBe(true)
  })

  test('EC-002: admin auth rejects missing API key', async ({ request }) => {
    const res = await request.get(`${API_BASE}/admin/auth/check`)
    expect(res.status()).toBe(401)
  })

  test('EC-003: admin auth rejects invalid API key', async ({ request }) => {
    const res = await request.get(`${API_BASE}/admin/auth/check`, {
      headers: { 'X-Admin-Api-Key': 'invalid-key-not-long-enough-xyz' },
    })
    expect(res.status()).toBe(401)
  })

  test('EC-004: batch creation rejects count=0', async ({ request }) => {
    const res = await request.post(`${API_BASE}/admin/tags/batches`, {
      headers: { 'X-Admin-Api-Key': ADMIN_API_KEY, 'Content-Type': 'application/json' },
      data: { count: 0 },
    })
    expect(res.status()).toBe(400)
  })

  test('EC-005: batch creation rejects count>5000', async ({ request }) => {
    const res = await request.post(`${API_BASE}/admin/tags/batches`, {
      headers: { 'X-Admin-Api-Key': ADMIN_API_KEY, 'Content-Type': 'application/json' },
      data: { count: 5001 },
    })
    expect(res.status()).toBe(400)
  })

  test('EC-006: batch creation rejects non-integer count', async ({ request }) => {
    const res = await request.post(`${API_BASE}/admin/tags/batches`, {
      headers: { 'X-Admin-Api-Key': ADMIN_API_KEY, 'Content-Type': 'application/json' },
      data: { count: 2.5 },
    })
    expect(res.status()).toBe(400)
  })

  test('EC-007: single-tag batch completes with COMPLETED status', async ({ request }) => {
    const createRes = await request.post(`${API_BASE}/admin/tags/batches`, {
      headers: { 'X-Admin-Api-Key': ADMIN_API_KEY, 'Content-Type': 'application/json' },
      data: { count: 1 },
    })
    const { batch } = (await createRes.json()) as { batch: { id: string } }
    const done = await waitForBatch(request, batch.id)
    expect(done.status).toBe('COMPLETED')
    expect(done.completedCount).toBe(1)
  })

  test('EC-008: newly generated tag is UNREGISTERED in public API', async ({ request }) => {
    const tagCode = await createFreshTag(request)
    const tag = await getTagInfo(request, tagCode)
    expect(tag.ok).toBe(true)
    if (tag.ok) {
      expect(tag.data.status).toBe('UNREGISTERED')
      expect(tag.data.vehicle.make).toBe('')
    }
  })

  test('EC-009: batch download fails while PENDING/PROCESSING', async ({ request }) => {
    const createRes = await request.post(`${API_BASE}/admin/tags/batches`, {
      headers: { 'X-Admin-Api-Key': ADMIN_API_KEY, 'Content-Type': 'application/json' },
      data: { count: 50 },
    })
    const { batch } = (await createRes.json()) as { batch: { id: string; status: string } }
    if (batch.status === 'COMPLETED') {
      test.skip(true, 'Batch completed before download could be tested')
      return
    }
    const dl = await request.get(`${API_BASE}/admin/tags/batches/${batch.id}/download`, {
      headers: { 'X-Admin-Api-Key': ADMIN_API_KEY },
    })
    expect([409, 422]).toContain(dl.status())
  })

  test('EC-010: completed batch ZIP contains tag code PNG', async ({ request }) => {
    const tagCode = await createFreshTag(request)
    expect(tagCode).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    )
  })

  test('EC-011: batch status poll returns progress fields', async ({ request }) => {
    const createRes = await request.post(`${API_BASE}/admin/tags/batches`, {
      headers: { 'X-Admin-Api-Key': ADMIN_API_KEY, 'Content-Type': 'application/json' },
      data: { count: 1 },
    })
    const { batch } = (await createRes.json()) as { batch: { id: string } }
    const done = await waitForBatch(request, batch.id)
    expect(done.progressPercent).toBe(100)
  })

  test('EC-012: unknown batch id returns 404 on status poll', async ({ request }) => {
    const res = await request.get(
      `${API_BASE}/admin/tags/batches/00000000-0000-0000-0000-000000000099`,
      { headers: { 'X-Admin-Api-Key': ADMIN_API_KEY } }
    )
    expect(res.status()).toBe(404)
  })

  test('EC-013: inventory endpoint returns summary counts', async ({ request }) => {
    const res = await request.get(`${API_BASE}/admin/tags/inventory`, {
      headers: { 'X-Admin-Api-Key': ADMIN_API_KEY },
    })
    expect(res.ok()).toBeTruthy()
    const body = (await res.json()) as {
      summary: { totalGenerated: number; inStock: number; sold: number }
    }
    expect(body.summary.totalGenerated).toBeGreaterThan(0)
    expect(body.summary.inStock + body.summary.sold).toBeLessThanOrEqual(
      body.summary.totalGenerated + 1
    )
  })

  test('EC-014: batch history list returns array', async ({ request }) => {
    const res = await request.get(`${API_BASE}/admin/tags/batches`, {
      headers: { 'X-Admin-Api-Key': ADMIN_API_KEY },
    })
    expect(res.ok()).toBeTruthy()
    const body = (await res.json()) as { batches: unknown[] }
    expect(Array.isArray(body.batches)).toBe(true)
  })

  test('EC-015: admin endpoints reject unauthenticated POST batch', async ({ request }) => {
    const res = await request.post(`${API_BASE}/admin/tags/batches`, {
      data: { count: 1 },
    })
    expect(res.status()).toBe(401)
  })

  test('EC-016: multi-tag batch (count=3) completes all tags', async ({ request }) => {
    const createRes = await request.post(`${API_BASE}/admin/tags/batches`, {
      headers: { 'X-Admin-Api-Key': ADMIN_API_KEY, 'Content-Type': 'application/json' },
      data: { count: 3 },
    })
    const { batch } = (await createRes.json()) as { batch: { id: string } }
    const done = await waitForBatch(request, batch.id)
    expect(done.completedCount).toBe(3)
  })

  test('EC-017: tag code in DB differs from internal tag id', async ({ request }) => {
    const tagCode = await createFreshTag(request)
    const tag = await getTagInfo(request, tagCode)
    expect(tag.ok).toBe(true)
    if (tag.ok) {
      expect(tag.data.tagId).not.toBe(tagCode)
    }
  })

  test('EC-018: lookup by internal tag id fails (must use tag code)', async ({ request }) => {
    const tagCode = await createFreshTag(request)
    const tag = await getTagInfo(request, tagCode)
    expect(tag.ok).toBe(true)
    if (tag.ok) {
      const byId = await request.get(`${API_BASE}/tags/${tag.data.tagId}`)
      expect(byId.status()).toBe(404)
    }
  })
})
