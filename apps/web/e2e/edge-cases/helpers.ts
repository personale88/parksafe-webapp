import { expect, type APIRequestContext, type Page } from '@playwright/test'
import { ADMIN_API_KEY, API_BASE } from '../helpers'

export {
  ADMIN_API_KEY,
  API_BASE,
  AUTH_STORAGE,
  captureDevOtpFromNextRequest,
  fillOtpInputs,
  clearAuthForSignInRedirect,
} from '../helpers'

export interface TagInfoResponse {
  tagId: string
  status: 'UNREGISTERED' | 'ACTIVE' | 'INACTIVE'
  vehicle: { make: string; model: string; colour: string; platePartial: string }
  availableChannels: Array<'WHATSAPP' | 'CALL'>
}

export interface BatchSummary {
  id: string
  status: string
  requestedCount: number
  completedCount: number
  progressPercent?: number
}

/** Unique 10-digit Indian mobile for test isolation. */
export function uniquePhone(): string {
  return `9${String(Date.now()).slice(-9)}`
}

export async function waitForBatch(
  request: APIRequestContext,
  batchId: string,
  timeoutMs = 30_000
): Promise<BatchSummary> {
  const start = Date.now()
  let last: BatchSummary | null = null
  while (Date.now() - start < timeoutMs) {
    const res = await request.get(`${API_BASE}/admin/tags/batches/${batchId}`, {
      headers: { 'X-Admin-Api-Key': ADMIN_API_KEY },
    })
    expect(res.ok()).toBeTruthy()
    const body = (await res.json()) as { batch: BatchSummary }
    last = body.batch
    if (last.status === 'COMPLETED') return last
    if (last.status === 'FAILED') throw new Error(`Batch ${batchId} failed`)
    await new Promise(r => setTimeout(r, 400))
  }
  throw new Error(`Batch ${batchId} timed out (last status: ${last?.status})`)
}

/** Creates a single-tag admin batch and returns the public tag code (QR UUID). */
export async function createFreshTag(request: APIRequestContext): Promise<string> {
  const createRes = await request.post(`${API_BASE}/admin/tags/batches`, {
    headers: { 'X-Admin-Api-Key': ADMIN_API_KEY, 'Content-Type': 'application/json' },
    data: { count: 1 },
  })
  expect(createRes.ok()).toBeTruthy()
  const { batch } = (await createRes.json()) as { batch: { id: string } }
  await waitForBatch(request, batch.id)

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

export async function getTagInfo(
  request: APIRequestContext,
  tagCode: string
): Promise<{ ok: true; data: TagInfoResponse } | { ok: false; status: number }> {
  const res = await request.get(`${API_BASE}/tags/${tagCode}`)
  if (!res.ok()) return { ok: false, status: res.status() }
  return { ok: true, data: (await res.json()) as TagInfoResponse }
}

export async function requestDevOtp(request: APIRequestContext, phoneDigits: string): Promise<string> {
  const res = await request.post(`${API_BASE}/auth/request-otp`, {
    data: { phone: `+91${phoneDigits}` },
  })
  expect(res.ok()).toBeTruthy()
  const body = (await res.json()) as { devOtp?: string }
  if (!body.devOtp) throw new Error('devOtp missing — set OTP_DEV_MODE=true')
  return body.devOtp
}

export interface RegisterResult {
  tagCode: string
  phone: string
  accessToken: string
  userId: string
}

/** Registers a fresh owner against a tag code via API (dev OTP mode). */
export async function registerTagViaApi(
  request: APIRequestContext,
  tagCode: string,
  opts?: { phone?: string; plate?: string; make?: string }
): Promise<RegisterResult> {
  const phone = opts?.phone ?? uniquePhone()
  let emergencyPhone = uniquePhone()
  while (emergencyPhone === phone) {
    emergencyPhone = uniquePhone()
  }

  let lastStatus = 0
  for (let attempt = 0; attempt < 3; attempt++) {
    const otp = await requestDevOtp(request, phone)
    const res = await request.post(`${API_BASE}/registration`, {
      data: {
        plate: opts?.plate ?? 'MH12AB9999',
        make: opts?.make ?? 'Hyundai',
        model: 'i20',
        colour: 'Red',
        vehicleType: 'CAR',
        ownerName: 'Edge Test Owner',
        ownerPhone: phone,
        emergencyName: 'Emergency Person',
        emergencyPhone,
        whatsappEnabled: true,
        consent: true,
        otp,
        tagCode,
      },
    })
    lastStatus = res.status()
    if (res.status() === 201) {
      const body = (await res.json()) as { accessToken: string; userId: string }
      return { tagCode, phone, accessToken: body.accessToken, userId: body.userId }
    }
    if (res.status() !== 400) break
    await new Promise(r => setTimeout(r, 200))
  }
  expect(lastStatus).toBe(201)
  throw new Error('registerTagViaApi failed')
}

export async function postContact(
  request: APIRequestContext,
  tagCode: string,
  body: { issueType: string; channel: string; customNote?: string },
  sessionId = `test-session-${Date.now()}`
): Promise<{ status: number; json: Record<string, unknown> }> {
  const res = await request.post(`${API_BASE}/contact/${tagCode}`, {
    headers: { 'X-Session-ID': sessionId, 'Content-Type': 'application/json' },
    data: body,
  })
  return { status: res.status(), json: (await res.json()) as Record<string, unknown> }
}

export async function clearRegisterDraft(page: Page): Promise<void> {
  await page.evaluate(() => sessionStorage.removeItem('parksafe-register-draft'))
}
