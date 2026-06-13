import { expect, type Page } from '@playwright/test'

/** Matches apps/web/lib/auth/devSession.ts and packages/db seed owner id. */
export const DEV_AUTH_USER_ID = '00000000-0000-0000-0000-000000000010'
export const DEV_AUTH_TOKEN = `dev-session:${DEV_AUTH_USER_ID}`

export const AUTH_STORAGE = {
  state: {
    token: DEV_AUTH_TOKEN,
    userId: DEV_AUTH_USER_ID,
  },
  version: 0,
}

export const ADMIN_API_KEY =
  process.env['ADMIN_API_KEY'] ?? 'parksafe-admin-development-key-123456789'

export const API_BASE = `${process.env['PLAYWRIGHT_BASE_URL'] ?? 'http://localhost:3000'}/backend`

/** Clears auth and blocks dev auto-login so dashboard guard redirects to sign-in. */
export async function clearAuthForSignInRedirect(page: Page): Promise<void> {
  await page.addInitScript(() => {
    localStorage.removeItem('parksafe-auth')
    sessionStorage.setItem('parksafe-signed-out', '1')
  })
}

/** Waits for the next successful request-otp response and returns devOtp. */
export async function captureDevOtpFromNextRequest(
  page: Page,
  trigger: () => Promise<void>
): Promise<string> {
  const responsePromise = page.waitForResponse(
    res => res.url().includes('/auth/request-otp') && res.ok()
  )
  await trigger()
  const response = await responsePromise
  const body = (await response.json()) as { devOtp?: string }
  if (!body.devOtp) {
    throw new Error('devOtp missing from request-otp response — is OTP_DEV_MODE=true?')
  }
  return body.devOtp
}

export async function fillOtpInputs(page: Page, otp: string): Promise<void> {
  expect(otp).toHaveLength(6)
  const otpInputs = page.locator('input[inputmode="numeric"]')
  for (let i = 0; i < 6; i++) {
    await otpInputs.nth(i).fill(otp[i]!)
  }
}
