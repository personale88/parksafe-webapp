import { test, expect } from '@playwright/test'

/** QR deep-link used in e2e — matches optional tagCode on the registration form. */
const REGISTER_WITH_TAG = '/register?tag=00000000-0000-0000-0000-000000000001'

test.describe('Register start (QR scan entry)', () => {
  test('shows scan instructions and buy cross-sell', async ({ page }) => {
    await page.goto('/register/start')
    await expect(page.getByRole('heading', { name: 'Scan your ParkSafe QR tag' })).toBeVisible()
    await expect(page.getByRole('heading', { name: "Don't have a ParkSafe tag yet?" })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Get ParkSafe QR tag' })).toBeVisible()
  })

  test('redirects bare /register to start page', async ({ page }) => {
    await page.goto('/register')
    await expect(page).toHaveURL(/\/register\/start/)
  })

  test('with tag query opens registration form', async ({ page }) => {
    await page.goto(REGISTER_WITH_TAG)
    await expect(page).toHaveURL(/\/register\?tag=/)
    await expect(page.getByRole('heading', { name: 'Register Your Vehicle' })).toBeVisible()
  })
})

test.describe('Owner Registration Flow', () => {
  test('registration page loads with Figma heading', async ({ page }) => {
    await page.goto(REGISTER_WITH_TAG)
    await expect(page.getByRole('heading', { name: 'Register Your Vehicle' })).toBeVisible()
    await expect(page.getByText('Fill in your vehicle details')).toBeVisible()
    await expect(page.getByText('park safe')).toBeVisible()
  })

  test('page title is set correctly for SEO', async ({ page }) => {
    await page.goto(REGISTER_WITH_TAG)
    await expect(page).toHaveTitle(/Register your vehicle/)
  })

  test('register button is disabled until form is complete', async ({ page }) => {
    await page.goto(REGISTER_WITH_TAG)
    const submit = page.getByRole('button', { name: 'Register Vehicle' })
    await expect(submit).toBeDisabled()
  })

  test('reset clears form fields', async ({ page }) => {
    await page.goto(REGISTER_WITH_TAG)
    await page.getByPlaceholder('Enter your full name').fill('Test User')
    await page.getByRole('button', { name: 'Reset' }).click()
    await expect(page.getByPlaceholder('Enter your full name')).toHaveValue('')
  })

  test('renders all section cards from design', async ({ page }) => {
    await page.goto(REGISTER_WITH_TAG)
    await expect(page.getByRole('heading', { name: 'Vehicle Details' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Owner Details' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Emergency Contact' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Consent' })).toBeVisible()
    await expect(page.getByText('Your Privacy is Our Priority')).toBeVisible()
  })

  test('phone prefix +91 is displayed', async ({ page }) => {
    await page.goto(REGISTER_WITH_TAG)
    const prefixes = page.getByText('+91')
    await expect(prefixes.first()).toBeVisible()
  })

  test('consent checkbox is unchecked by default', async ({ page }) => {
    await page.goto(REGISTER_WITH_TAG)
    const consent = page.locator('input[name="consent"]')
    await expect(consent).not.toBeChecked()
  })

  test('whatsapp checkbox is checked by default', async ({ page }) => {
    await page.goto(REGISTER_WITH_TAG)
    const whatsapp = page.locator('input[name="whatsappEnabled"]')
    await expect(whatsapp).toBeChecked()
  })
})
