import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  hashDistinctId,
  resetAnalyticsWarningsForTests,
  trackServer,
} from '../../src/lib/analytics'

describe('analytics', () => {
  const fetchMock = vi.fn()

  beforeEach(() => {
    vi.stubGlobal('fetch', fetchMock)
    fetchMock.mockReset()
    fetchMock.mockResolvedValue({ ok: true })
    resetAnalyticsWarningsForTests()
    vi.stubEnv('POSTHOG_KEY', 'phc_test_key')
    vi.stubEnv('POSTHOG_HOST', 'https://us.i.posthog.com')
    vi.stubEnv('POSTHOG_DISABLED', 'false')
    vi.stubEnv('POSTHOG_ENABLED', 'true')
    vi.stubEnv('NODE_ENV', 'development')
  })

  afterEach(async () => {
    await new Promise(resolve => setTimeout(resolve, 20))
    vi.unstubAllEnvs()
    vi.unstubAllGlobals()
  })

  it('hashDistinctId returns stable opaque ids', () => {
    const a = hashDistinctId('session-abc')
    const b = hashDistinctId('session-abc')
    expect(a).toBe(b)
    expect(a).toHaveLength(32)
    expect(a).not.toContain('session')
  })

  it('trackServer posts capture payload with source api', async () => {
    trackServer('user-uuid', {
      event: 'sign_in_completed',
      properties: {},
    })

    await vi.waitFor(() => expect(fetchMock).toHaveBeenCalled())

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit]
    expect(url).toBe('https://us.i.posthog.com/capture/')
    const body = JSON.parse(String(init.body))
    expect(body.api_key).toBe('phc_test_key')
    expect(body.event).toBe('sign_in_completed')
    expect(body.distinct_id).toBe('user-uuid')
    expect(body.properties.source).toBe('api')
  })

  it('trackServer is a no-op when POSTHOG_KEY is missing', async () => {
    vi.stubEnv('POSTHOG_KEY', '')
    fetchMock.mockClear()
    trackServer('user-uuid', {
      event: 'contact_sent',
      properties: { channel: 'WHATSAPP', issueType: 'BLOCKING_VEHICLE' },
    })
    await new Promise(resolve => setTimeout(resolve, 30))
    expect(fetchMock).not.toHaveBeenCalled()
  })
})
