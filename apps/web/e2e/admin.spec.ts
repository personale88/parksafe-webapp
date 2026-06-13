import { test, expect } from '@playwright/test'
import { ADMIN_API_KEY } from './helpers'

async function signInToAdmin(page: import('@playwright/test').Page) {
  await page.goto('/admin')
  await expect(page.getByRole('heading', { name: 'Admin access' })).toBeVisible()
  await page.getByLabel('API key').fill(ADMIN_API_KEY)
  await page.getByRole('button', { name: 'Continue' }).click()
  await expect(page.getByRole('tab', { name: 'Generate' })).toBeVisible({ timeout: 15_000 })
}

test.describe('Admin QR Tag Generator', () => {
  test('shows auth gate before API key', async ({ page }) => {
    await page.goto('/admin')
    await expect(page.getByRole('heading', { name: 'QR Tag Generator' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Admin access' })).toBeVisible()
    await expect(page.getByLabel('API key')).toBeVisible()
  })

  test('rejects empty API key', async ({ page }) => {
    await page.goto('/admin')
    await page.getByRole('button', { name: 'Continue' }).click()
    await expect(page.getByText('API key is required')).toBeVisible()
  })

  test('authenticates and shows generate workspace', async ({ page }) => {
    await signInToAdmin(page)
    await expect(page.getByRole('heading', { name: 'Generate tags' })).toBeVisible()
    await expect(page.getByLabel('Number of tags')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Generate' })).toBeVisible()
    await expect(page.getByText('Sign out')).toBeVisible()
  })

  test('inventory tab shows stock summary', async ({ page }) => {
    await signInToAdmin(page)
    await page.getByRole('tab', { name: 'Inventory' }).click()
    await expect(page.getByRole('tabpanel')).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Tag inventory' })).toBeVisible({ timeout: 15_000 })
  })

  test('generates a small batch end-to-end', async ({ page }) => {
    await signInToAdmin(page)
    await page.getByLabel('Number of tags').fill('3')
    await page.getByRole('button', { name: 'Generate' }).click()

    await expect(page.getByRole('progressbar').first()).toBeVisible({ timeout: 15_000 })
    await expect(page.getByRole('button', { name: 'Download ZIP' }).first()).toBeVisible({
      timeout: 60_000,
    })
  })

  test('sign out returns to auth gate', async ({ page }) => {
    await signInToAdmin(page)
    await page.getByRole('button', { name: 'Sign out' }).click()
    await expect(page.getByRole('heading', { name: 'Admin access' })).toBeVisible()
  })
})
