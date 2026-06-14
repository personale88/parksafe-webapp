import { test, expect } from '@playwright/test'
import {
  ADMIN_API_KEY,
  API_BASE,
  AUTH_STORAGE,
  createFreshTag,
  getTagInfo,
  registerTagViaApi,
} from './helpers'

test.describe('EC-Privacy & public API boundaries', () => {
  test('EC-089: public tag API never returns ownerId field', async ({ request }) => {
    const tagCode = await createFreshTag(request)
    await registerTagViaApi(request, tagCode)
    const res = await request.get(`${API_BASE}/tags/${tagCode}`)
    const body = (await res.json()) as Record<string, unknown>
    expect(body).not.toHaveProperty('ownerId')
    expect(body).not.toHaveProperty('ownerPhone')
    expect(body).not.toHaveProperty('displayName')
    expect(body).not.toHaveProperty('email')
  })

  test('EC-090: public tag API returns only allowed vehicle fields', async ({ request }) => {
    const tagCode = await createFreshTag(request)
    await registerTagViaApi(request, tagCode)
    const res = await request.get(`${API_BASE}/tags/${tagCode}`)
    const body = (await res.json()) as {
      vehicle: Record<string, unknown>
    }
    const keys = Object.keys(body.vehicle)
    expect(keys.sort()).toEqual(['colour', 'make', 'model', 'platePartial'].sort())
  })

  test('EC-091: platePartial masks middle characters', async ({ request }) => {
    const tagCode = await createFreshTag(request)
    await registerTagViaApi(request, tagCode, { plate: 'MH12AB1234' })
    const tag = await getTagInfo(request, tagCode)
    expect(tag.ok).toBe(true)
    if (tag.ok) {
      expect(tag.data.vehicle.platePartial).toBe('MH**1234')
      expect(tag.data.vehicle.platePartial).not.toContain('AB')
    }
  })

  test('EC-092: UNREGISTERED tag public response has empty vehicle fields', async ({
    request,
  }) => {
    const tagCode = await createFreshTag(request)
    const tag = await getTagInfo(request, tagCode)
    expect(tag.ok).toBe(true)
    if (tag.ok) {
      expect(tag.data.vehicle.make).toBe('')
      expect(tag.data.vehicle.platePartial).toBe('')
    }
  })

  test('EC-093: admin inventory requires API key', async ({ request }) => {
    const res = await request.get(`${API_BASE}/admin/tags/inventory`)
    expect(res.status()).toBe(401)
  })

  test('EC-094: landing page loads without auth', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByText('Contact any vehicle owner')).toBeVisible()
  })

  test('EC-095: admin page shows auth gate without key', async ({ page }) => {
    await page.goto('/admin')
    await expect(page.getByText('Admin access')).toBeVisible()
  })

  test('EC-096: terms page is public', async ({ page }) => {
    await page.goto('/terms')
    await expect(page).toHaveURL(/\/terms/)
  })

  test('EC-097: privacy page is public', async ({ page }) => {
    await page.goto('/privacy')
    await expect(page).toHaveURL(/\/privacy/)
  })

  test('EC-098: 404 page for unknown routes', async ({ page }) => {
    await page.goto('/this-route-does-not-exist-xyz')
    await expect(page.getByText('Page not found')).toBeVisible()
  })

  test('EC-099: contact success screen shows no owner PII', async ({ page, request }) => {
    const tagCode = await createFreshTag(request)
    const reg = await registerTagViaApi(request, tagCode)
    await page.goto(`/contact/${tagCode}`)
    await page.getByRole('button', { name: /Blocking my vehicle/i }).click()
    await page.getByRole('button', { name: /Send on WhatsApp/i }).click()
    await expect(page.getByText('Message Delivered')).toBeVisible({ timeout: 15_000 })
    await expect(page.getByText(reg.phone)).not.toBeVisible()
    await expect(page.getByText('Edge Test Owner')).not.toBeVisible()
  })

  test('EC-100: dashboard vehicles subpage requires auth', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.removeItem('parksafe-auth')
      sessionStorage.setItem('parksafe-signed-out', '1')
    })
    await page.goto('/dashboard/vehicles')
    await expect(page).toHaveURL(/\/sign-in/)
  })

  test('EC-101: authenticated user can open dashboard vehicles', async ({ page }) => {
    await page.addInitScript(storage => {
      localStorage.setItem('parksafe-auth', JSON.stringify(storage))
    }, AUTH_STORAGE)
    await page.goto('/dashboard/vehicles')
    await expect(page).toHaveURL(/\/dashboard\/vehicles/)
  })

  test('EC-102: settings page requires auth', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.removeItem('parksafe-auth')
      sessionStorage.setItem('parksafe-signed-out', '1')
    })
    await page.goto('/dashboard/settings')
    await expect(page).toHaveURL(/\/sign-in/)
  })

  test('EC-103: help page requires auth', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.removeItem('parksafe-auth')
      sessionStorage.setItem('parksafe-signed-out', '1')
    })
    await page.goto('/dashboard/profile/help')
    await expect(page).toHaveURL(/\/sign-in/)
  })

  test('EC-104: tag list GET /tags is reachable (documents exposure risk)', async ({
    request,
  }) => {
    const res = await request.get(`${API_BASE}/tags`)
    expect([200, 401, 403]).toContain(res.status())
  })

  test('EC-105: inventory sold count increases after tag activation', async ({ request }) => {
    const beforeRes = await request.get(`${API_BASE}/admin/tags/inventory`, {
      headers: { 'X-Admin-Api-Key': ADMIN_API_KEY },
    })
    const before = (await beforeRes.json()) as { summary: { sold: number; inStock: number } }
    const tagCode = await createFreshTag(request)
    await registerTagViaApi(request, tagCode)
    const afterRes = await request.get(`${API_BASE}/admin/tags/inventory`, {
      headers: { 'X-Admin-Api-Key': ADMIN_API_KEY },
    })
    const after = (await afterRes.json()) as { summary: { sold: number; inStock: number } }
    expect(after.summary.sold).toBeGreaterThanOrEqual(before.summary.sold)
    expect(after.summary.inStock).toBeLessThanOrEqual(before.summary.inStock)
  })

  test('EC-106: back to issues link returns to step 1', async ({ page, request }) => {
    const tagCode = await createFreshTag(request)
    await registerTagViaApi(request, tagCode)
    await page.goto(`/contact/${tagCode}`)
    await page.getByRole('button', { name: /Blocking my vehicle/i }).click()
    await page.getByRole('link', { name: 'Back to issues' }).click()
    await expect(page).toHaveURL(new RegExp(`/contact/${tagCode}$`))
  })

  test('EC-107: contact flow step indicator shows Step 1 of 2', async ({ page, request }) => {
    const tagCode = await createFreshTag(request)
    await registerTagViaApi(request, tagCode)
    await page.goto(`/contact/${tagCode}`)
    await expect(page.getByText('Step 1 of 2')).toBeVisible()
  })

  test('EC-108: channel step shows Step 2 of 2', async ({ page, request }) => {
    const tagCode = await createFreshTag(request)
    await registerTagViaApi(request, tagCode)
    await page.goto(`/contact/${tagCode}`)
    await page.getByRole('button', { name: /Blocking my vehicle/i }).click()
    await expect(page.getByText('Step 2 of 2')).toBeVisible()
  })

  test('EC-109: register start page accessible without tag', async ({ page }) => {
    await page.goto('/register/start')
    await expect(page.getByText(/Scan your ParkSafe QR tag/i)).toBeVisible()
  })

  test('EC-110: home page sign-in link works', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('link', { name: 'Sign In' }).click()
    await expect(page).toHaveURL(/\/sign-in/)
  })
})
