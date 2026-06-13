import { test, expect } from '@playwright/test'
import {
  ADMIN_API_KEY,
  API_BASE,
  captureDevOtpFromNextRequest,
  fillOtpInputs,
} from './helpers'

async function createFreshTag(request: import('@playwright/test').APIRequestContext): Promise<string> {
  const createRes = await request.post(`${API_BASE}/admin/tags/batches`, {
    headers: { 'X-Admin-Api-Key': ADMIN_API_KEY, 'Content-Type': 'application/json' },
    data: { count: 1 },
  })
  expect(createRes.ok()).toBeTruthy()
  const { batch } = (await createRes.json()) as { batch: { id: string } }

  let status = batch.id ? 'PENDING' : 'FAILED'
  for (let i = 0; i < 30; i++) {
    const poll = await request.get(`${API_BASE}/admin/tags/batches/${batch.id}`, {
      headers: { 'X-Admin-Api-Key': ADMIN_API_KEY },
    })
    const body = (await poll.json()) as { batch: { status: string } }
    status = body.batch.status
    if (status === 'COMPLETED') break
    if (status === 'FAILED') throw new Error('Batch generation failed')
    await new Promise(r => setTimeout(r, 500))
  }
  expect(status).toBe('COMPLETED')

  const zipRes = await request.get(`${API_BASE}/admin/tags/batches/${batch.id}/download`, {
    headers: { 'X-Admin-Api-Key': ADMIN_API_KEY },
  })
  expect(zipRes.ok()).toBeTruthy()
  const zipBuffer = await zipRes.body()
  const pngMatch = zipBuffer.toString('binary').match(
    /qr-codes\/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})\.png/i
  )
  if (!pngMatch?.[1]) throw new Error('Could not parse tag code from batch ZIP')
  return pngMatch[1]
}

test.describe('QR scan → register vehicle', () => {
  test.describe.configure({ mode: 'serial' })
  test.setTimeout(60_000)

  test('generates QR, scans unregistered tag, completes registration', async ({ page, request }) => {
    const tagCode = await createFreshTag(request)
    const ownerPhone = `9${String(Date.now()).slice(-9)}`

    // Simulate scanning the QR — opens /contact/{tagCode}
    await page.goto(`/contact/${tagCode}`)
    await expect(page.getByText('Tag not activated')).toBeVisible()
    await page.getByRole('link', { name: 'Register vehicle' }).click()
    await expect(page).toHaveURL(new RegExp(`/register\\?tag=${tagCode}`))

    await page.evaluate(() => localStorage.removeItem('parksafe-register-draft'))
    await page.reload()
    await expect(page.getByRole('heading', { name: 'Register Your Vehicle' })).toBeVisible()

    // Fill registration form
    await page.getByLabel('Vehicle Number').fill('MH12AB9999')
    await page.getByLabel('Vehicle Brand').fill('Hyundai')
    await page.getByLabel('Vehicle Model').fill('i20')
    await page.getByLabel('Vehicle Color').fill('Red')
    await page.locator('input[name="ownerName"]').fill('Test Owner')
    await page.locator('input[name="ownerPhone"]').fill(ownerPhone)
    await page.locator('input[name="emergencyName"]').fill('Emergency Contact')
    await page.locator('input[name="emergencyPhone"]').fill('9876543211')
    await page.locator('input[name="consent"]').check({ force: true })

    const submit = page.getByRole('button', { name: 'Register Vehicle' })
    await expect(submit).toBeEnabled({ timeout: 10_000 })

    const devOtp = await captureDevOtpFromNextRequest(page, async () => {
      await submit.click()
    })
    await expect(page).toHaveURL(/\/register\/otp/)
    await fillOtpInputs(page, devOtp)

    await expect(page).toHaveURL(/\/register\/success/, { timeout: 15_000 })
    await expect(page.getByText("You're all set!")).toBeVisible()

    const tagRes = await request.get(`${API_BASE}/tags/${tagCode}`)
    expect(tagRes.ok()).toBeTruthy()
    const tagBody = (await tagRes.json()) as { status: string; vehicle: { make: string } }
    expect(tagBody.status).toBe('ACTIVE')
    expect(tagBody.vehicle.make).toBe('Hyundai')
  })
})
