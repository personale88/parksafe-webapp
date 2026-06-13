import { test, expect } from '@playwright/test'
import { captureDevOtpFromNextRequest, fillOtpInputs } from './helpers'

/** Seed owner phone from packages/db/src/seed.ts */
const SEED_OWNER_PHONE = '9876543210'

test.describe('Sign in complete flow', () => {
  test.setTimeout(60_000)

  test('registered owner signs in with OTP and reaches dashboard', async ({ page }) => {
    await page.goto('/sign-in')
    await page.getByLabel('Mobile number').fill(SEED_OWNER_PHONE)

    const devOtp = await captureDevOtpFromNextRequest(page, async () => {
      await page.getByRole('button', { name: 'Send OTP' }).click()
    })
    await expect(page).toHaveURL(/\/sign-in\/otp/)

    await fillOtpInputs(page, devOtp)

    await expect(page).toHaveURL(/\/dashboard/, { timeout: 15_000 })
    await expect(page.getByText('Active vehicles')).toBeVisible()
  })
})
