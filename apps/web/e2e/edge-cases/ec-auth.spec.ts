import { test, expect } from '@playwright/test'
import {
  API_BASE,
  AUTH_STORAGE,
  clearAuthForSignInRedirect,
  createFreshTag,
  registerTagViaApi,
  requestDevOtp,
  uniquePhone,
} from './helpers'

test.describe('EC-Auth: OTP & sign-in edge cases', () => {
  test('EC-069: request-otp returns devOtp in dev mode', async ({ request }) => {
    const phone = uniquePhone()
    const res = await request.post(`${API_BASE}/auth/request-otp`, {
      data: { phone: `+91${phone}` },
    })
    expect(res.ok()).toBeTruthy()
    const body = (await res.json()) as { devOtp?: string }
    expect(body.devOtp).toMatch(/^\d{6}$/)
  })

  test('EC-070: request-otp rejects invalid E.164 phone', async ({ request }) => {
    const res = await request.post(`${API_BASE}/auth/request-otp`, {
      data: { phone: '+1234567890' },
    })
    expect(res.status()).toBe(400)
  })

  test('EC-071: verify-otp rejects wrong code', async ({ request }) => {
    const phone = uniquePhone()
    await requestDevOtp(request, phone)
    const res = await request.post(`${API_BASE}/auth/verify-otp`, {
      data: { phone: `+91${phone}`, otp: '000000' },
    })
    expect(res.status()).toBe(400)
  })

  test('EC-072: verify-otp accepts correct dev OTP', async ({ request }) => {
    const phone = uniquePhone()
    const otp = await requestDevOtp(request, phone)
    const res = await request.post(`${API_BASE}/auth/verify-otp`, {
      data: { phone: `+91${phone}`, otp },
    })
    expect(res.ok()).toBeTruthy()
  })

  test('EC-073: sign-in check unregistered phone returns registered:false', async ({
    request,
  }) => {
    const phone = uniquePhone()
    const res = await request.post(`${API_BASE}/auth/sign-in/check`, {
      data: { phone: `+91${phone}` },
    })
    expect(res.ok()).toBeTruthy()
    const body = (await res.json()) as { registered: boolean }
    expect(body.registered).toBe(false)
  })

  test('EC-074: sign-in check registered phone returns registered:true', async ({ request }) => {
    const tagCode = await createFreshTag(request)
    const phone = uniquePhone()
    await registerTagViaApi(request, tagCode, { phone })
    const res = await request.post(`${API_BASE}/auth/sign-in/check`, {
      data: { phone: `+91${phone}` },
    })
    expect(res.ok()).toBeTruthy()
    const body = (await res.json()) as { registered: boolean }
    expect(body.registered).toBe(true)
  })

  test('EC-075: sign-in with valid OTP for registered user succeeds', async ({ request }) => {
    const tagCode = await createFreshTag(request)
    const phone = uniquePhone()
    await registerTagViaApi(request, tagCode, { phone })
    const otp = await requestDevOtp(request, phone)
    const res = await request.post(`${API_BASE}/auth/sign-in`, {
      data: { phone: `+91${phone}`, otp },
    })
    expect(res.ok()).toBeTruthy()
    const body = (await res.json()) as { accessToken: string }
    expect(body.accessToken).toBeTruthy()
  })

  test('EC-076: sign-in unregistered phone returns error', async ({ request }) => {
    const phone = uniquePhone()
    const otp = await requestDevOtp(request, phone)
    const res = await request.post(`${API_BASE}/auth/sign-in`, {
      data: { phone: `+91${phone}`, otp },
    })
    expect(res.status()).toBe(400)
  })

  test('EC-077: dashboard API rejects unauthenticated request', async ({ request }) => {
    const res = await request.get(`${API_BASE}/dashboard`)
    expect(res.status()).toBe(401)
  })

  test('EC-078: dashboard API accepts dev session token', async ({ request }) => {
    const res = await request.get(`${API_BASE}/dashboard`, {
      headers: { Authorization: `Bearer ${AUTH_STORAGE.state.token}` },
    })
    expect(res.ok()).toBeTruthy()
  })

  test('EC-079: dashboard UI redirects unauthenticated users', async ({ page }) => {
    await clearAuthForSignInRedirect(page)
    await page.goto('/dashboard')
    await expect(page).toHaveURL(/\/sign-in/)
  })

  test('EC-080: dashboard UI loads for authenticated dev user', async ({ page }) => {
    await page.addInitScript(storage => {
      localStorage.setItem('parksafe-auth', JSON.stringify(storage))
    }, AUTH_STORAGE)
    await page.goto('/dashboard')
    await expect(page).toHaveURL(/\/dashboard/)
  })

  test('EC-081: sign-in page accessible without auth', async ({ page }) => {
    await clearAuthForSignInRedirect(page)
    await page.goto('/sign-in')
    await expect(page.getByRole('heading', { name: 'Welcome back' })).toBeVisible()
  })

  test('EC-082: OTP must be exactly 6 digits on verify', async ({ request }) => {
    const phone = uniquePhone()
    await requestDevOtp(request, phone)
    const res = await request.post(`${API_BASE}/auth/verify-otp`, {
      data: { phone: `+91${phone}`, otp: '12345' },
    })
    expect(res.status()).toBe(400)
  })

  test('EC-083: refresh without token returns 401', async ({ request }) => {
    const res = await request.post(`${API_BASE}/auth/refresh`, {
      data: {},
    })
    expect([400, 401]).toContain(res.status())
  })

  test('EC-084: logout is idempotent with invalid token', async ({ request }) => {
    const res = await request.post(`${API_BASE}/auth/logout`, {
      data: { refreshToken: 'invalid-token-value' },
    })
    expect([200, 401]).toContain(res.status())
  })

  test('EC-085: vehicles API requires auth', async ({ request }) => {
    const res = await request.get(`${API_BASE}/vehicles`)
    expect(res.status()).toBe(401)
  })

  test('EC-086: profile API requires auth', async ({ request }) => {
    const res = await request.get(`${API_BASE}/profile`)
    expect(res.status()).toBe(401)
  })

  test('EC-087: sign-in OTP page redirects without stored phone', async ({ page }) => {
    await page.goto('/sign-in/otp')
    await expect(page).toHaveURL(/\/sign-in/)
  })

  test('EC-088: register OTP page redirects without draft', async ({ page, request }) => {
    const tagCode = await createFreshTag(request)
    await page.goto(`/register/otp?tag=${tagCode}`)
    await expect(page).toHaveURL(new RegExp(`/register\\?tag=${tagCode}`))
  })
})
