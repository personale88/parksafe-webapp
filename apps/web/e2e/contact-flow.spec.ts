import { test, expect } from '@playwright/test'

/**
 * E2E: Reporter contact flow with URL-per-step routing.
 */
test.describe('Contact Owner Flow', () => {
  test('step 1 and step 2 have distinct URLs (dev preview)', async ({ page }) => {
    await page.goto('/contact')
    await expect(page).toHaveURL(/\/contact$/)

    await expect(page.getByRole('heading', { name: 'Contact Owner' })).toBeVisible()
    await expect(page.getByText('Step 1 of 2')).toBeVisible()

    await page.getByRole('button', { name: /Blocking my vehicle/i }).click()

    await expect(page).toHaveURL(/\/contact\/channel\?issue=BLOCKING_VEHICLE/)
    await expect(page.getByText('Step 2 of 2')).toBeVisible()
    await expect(page.getByText('Selected Issue')).toBeVisible()
  })

  test('reporter can contact vehicle owner via WhatsApp', async ({ page }) => {
    await page.goto('/contact/test-tag-uuid-001')

    await page.getByRole('button', { name: /Blocking my vehicle/i }).click()
    await expect(page).toHaveURL(/\/contact\/test-tag-uuid-001\/channel\?issue=BLOCKING_VEHICLE/)

    await page.getByRole('button', { name: /Send on WhatsApp/i }).click()

    await expect(page).toHaveURL(/\/contact\/test-tag-uuid-001\/success\?issue=/)
    await expect(page.getByText('Message Delivered')).toBeVisible()
    await expect(page.getByText(/notified via WhatsApp/i)).toBeVisible()
    await expect(page.getByText('Alert sent')).toBeVisible()
    await expect(page.getByRole('link', { name: 'Back to Home' })).toBeVisible()
  })

  test('shows unactivated tag screen for unregistered QR', async ({ page }) => {
    await page.goto('/contact/unregistered-tag-uuid')

    await expect(page.getByText('Tag not activated')).toBeVisible()
    await expect(page.getByRole('link', { name: 'Register vehicle' })).toBeVisible()
  })

  test('shows inactive tag screen for paused tags', async ({ page }) => {
    await page.goto('/contact/inactive-tag-uuid')

    await expect(page.getByText('Tag temporarily inactive')).toBeVisible()
  })

  test('back to issues returns to step 1 URL', async ({ page }) => {
    await page.goto('/contact')
    await page.getByRole('button', { name: /Blocking my vehicle/i }).click()
    await expect(page).toHaveURL(/\/contact\/channel/)

    await page.getByRole('link', { name: 'Back to issues' }).click()
    await expect(page).toHaveURL(/\/contact$/)
    await expect(page.getByText('Step 1 of 2')).toBeVisible()
  })

  test('channel page without issue redirects to step 1', async ({ page }) => {
    await page.goto('/contact/channel')
    await expect(page).toHaveURL(/\/contact$/)
  })

  test('disabled call channel is not actionable', async ({ page }) => {
    await page.goto('/contact/test-tag-uuid-001')
    await page.getByRole('button', { name: /Blocking my vehicle/i }).click()

    const callButton = page.getByRole('button', { name: /Call Owner/i })
    await expect(callButton).toBeDisabled()
  })
})
