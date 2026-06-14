import { test, expect } from '@playwright/test'
import {
  captureDevOtpFromNextRequest,
  clearRegisterDraft,
  createFreshTag,
  fillOtpInputs,
  getTagInfo,
  registerTagViaApi,
  uniquePhone,
} from './helpers'

test.describe('EC-Rescan: QR reuse after registration', () => {
  test('EC-034: unregistered scan shows Tag not activated screen', async ({ page, request }) => {
    const tagCode = await createFreshTag(request)
    await page.goto(`/contact/${tagCode}`)
    await expect(page.getByText('Tag not activated')).toBeVisible()
    await expect(page.getByRole('link', { name: 'Register vehicle' })).toBeVisible()
  })

  test('EC-035: register CTA links to /register?tag={code}', async ({ page, request }) => {
    const tagCode = await createFreshTag(request)
    await page.goto(`/contact/${tagCode}`)
    await page.getByRole('link', { name: 'Register vehicle' }).click()
    await expect(page).toHaveURL(new RegExp(`/register\\?tag=${tagCode}`))
  })

  test('EC-036: after registration rescan shows issue grid not register', async ({
    page,
    request,
  }) => {
    const tagCode = await createFreshTag(request)
    await registerTagViaApi(request, tagCode, { make: 'RescanMake' })
    await page.goto(`/contact/${tagCode}`)
    await expect(page.getByText("What's the issue?")).toBeVisible()
    await expect(page.getByText('RescanMake')).toBeVisible()
    await expect(page.getByText('Tag not activated')).not.toBeVisible()
  })

  test('EC-037: /qr/{tagCode} redirects to /contact/{tagCode}', async ({ page, request }) => {
    const tagCode = await createFreshTag(request)
    await registerTagViaApi(request, tagCode)
    await page.goto(`/qr/${tagCode}`)
    await expect(page).toHaveURL(new RegExp(`/contact/${tagCode}$`))
    await expect(page.getByText("What's the issue?")).toBeVisible()
  })

  test('EC-038: rescan shows masked plate only (partial)', async ({ page, request }) => {
    const tagCode = await createFreshTag(request)
    await registerTagViaApi(request, tagCode, { plate: 'DL01XY5678' })
    await page.goto(`/contact/${tagCode}`)
    await expect(page.getByText(/DL \*\* 5678/)).toBeVisible()
    await expect(page.getByText('DL01XY5678')).not.toBeVisible()
  })

  test('EC-039: rescan does not show owner name or phone', async ({ page, request }) => {
    const tagCode = await createFreshTag(request)
    const phone = uniquePhone()
    await registerTagViaApi(request, tagCode, { phone })
    await page.goto(`/contact/${tagCode}`)
    await expect(page.getByText('Edge Test Owner')).not.toBeVisible()
    await expect(page.getByText(phone)).not.toBeVisible()
    await expect(page.getByText(/\+91/)).not.toBeVisible()
  })

  test('EC-040: inactive seed tag shows paused screen', async ({ page }) => {
    await page.goto('/contact/inactive-tag-uuid')
    await expect(page.getByText('Tag temporarily inactive')).toBeVisible()
    await expect(page.getByText('Tag not activated')).not.toBeVisible()
  })

  test('EC-041: active seed tag shows contact flow', async ({ page }) => {
    await page.goto('/contact/test-tag-uuid-001')
    await expect(page.getByText("What's the issue?")).toBeVisible()
    await expect(page.getByText('Tag not activated')).not.toBeVisible()
  })

  test('EC-042: unknown tag shows register CTA (same as unregistered)', async ({ page }) => {
    await page.goto('/contact/00000000-0000-0000-0000-000000000088')
    await expect(page.getByText('Tag not activated')).toBeVisible()
  })

  test('EC-043: full UI registration then rescan shows contact flow', async ({ page, request }) => {
    const tagCode = await createFreshTag(request)
    const phone = uniquePhone()

    await page.goto(`/contact/${tagCode}`)
    await page.getByRole('link', { name: 'Register vehicle' }).click()
    await clearRegisterDraft(page)
    await page.reload()

    await page.getByLabel('Vehicle Number').fill('MH12AB9999')
    await page.getByLabel('Vehicle Brand').fill('FullFlow')
    await page.getByLabel('Vehicle Model').fill('i20')
    await page.getByLabel('Vehicle Color').fill('Red')
    await page.locator('input[name="ownerName"]').fill('UI Owner')
    await page.locator('input[name="ownerPhone"]').fill(phone)
    await page.locator('input[name="emergencyName"]').fill('Emergency')
    await page.locator('input[name="emergencyPhone"]').fill('9876543211')
    await page.locator('input[name="consent"]').check({ force: true })

    const submit = page.getByRole('button', { name: 'Register Vehicle' })
    const devOtp = await captureDevOtpFromNextRequest(page, async () => {
      await submit.click()
    })
    await expect(page).toHaveURL(/\/register\/otp/)
    const regPromise = page.waitForResponse(
      res => res.url().includes('/registration') && res.request().method() === 'POST',
      { timeout: 20_000 }
    )
    await fillOtpInputs(page, devOtp)
    const regRes = await regPromise
    expect(regRes.status()).toBe(201)
    await expect(page).toHaveURL(/\/register\/success/, { timeout: 15_000 })

    const tag = await getTagInfo(request, tagCode)
    expect(tag.ok).toBe(true)
    if (tag.ok) expect(tag.data.status).toBe('ACTIVE')

    await page.goto(`/contact/${tagCode}`)
    await expect(page.getByText('FullFlow')).toBeVisible()
    await expect(page.getByText("What's the issue?")).toBeVisible()
  })

  test('EC-044: register page without tag redirects to start', async ({ page }) => {
    await page.goto('/register')
    await expect(page).toHaveURL(/\/register\/start/)
  })

  test('EC-045: register with tag query shows registration form', async ({ page, request }) => {
    const tagCode = await createFreshTag(request)
    await page.goto(`/register?tag=${tagCode}`)
    await expect(page.getByRole('heading', { name: 'Register Your Vehicle' })).toBeVisible()
  })

  test('EC-046: anonymity banner visible on active tag contact page', async ({ page, request }) => {
    const tagCode = await createFreshTag(request)
    await registerTagViaApi(request, tagCode)
    await page.goto(`/contact/${tagCode}`)
    await expect(page.getByText('🔒 Anonymous & Secure')).toBeVisible()
  })

  test('EC-047: issue selection navigates to channel step URL', async ({ page, request }) => {
    const tagCode = await createFreshTag(request)
    await registerTagViaApi(request, tagCode)
    await page.goto(`/contact/${tagCode}`)
    await page.getByRole('button', { name: /Blocking my vehicle/i }).click()
    await expect(page).toHaveURL(
      new RegExp(`/contact/${tagCode}/channel\\?issue=BLOCKING_VEHICLE`)
    )
  })

  test('EC-048: channel step without issue redirects to issue step', async ({ page, request }) => {
    const tagCode = await createFreshTag(request)
    await registerTagViaApi(request, tagCode)
    await page.goto(`/contact/${tagCode}/channel`)
    await expect(page).toHaveURL(new RegExp(`/contact/${tagCode}$`))
  })

  test('EC-049: two different tags — only registered one shows vehicle', async ({
    page,
    request,
  }) => {
    const unreg = await createFreshTag(request)
    const reg = await createFreshTag(request)
    await registerTagViaApi(request, reg, { make: 'RegisteredOnly' })

    await page.goto(`/contact/${unreg}`)
    await expect(page.getByText('Tag not activated')).toBeVisible()

    await page.goto(`/contact/${reg}`)
    await expect(page.getByText('RegisteredOnly')).toBeVisible()
  })

  test('EC-050: API status ACTIVE matches UI contact flow after rescan', async ({
    page,
    request,
  }) => {
    const tagCode = await createFreshTag(request)
    await registerTagViaApi(request, tagCode)
    const tag = await getTagInfo(request, tagCode)
    expect(tag.ok).toBe(true)
    if (tag.ok) expect(tag.data.status).toBe('ACTIVE')

    await page.goto(`/contact/${tagCode}`)
    await expect(page.getByText("What's the issue?")).toBeVisible()
  })
})
