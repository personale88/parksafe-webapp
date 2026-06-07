import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockFetch = vi.fn()
vi.stubGlobal('fetch', mockFetch)

function mockLocalStorage() {
  const store = new Map<string, string>()
  vi.stubGlobal('localStorage', {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => {
      store.set(key, value)
    },
    removeItem: (key: string) => {
      store.delete(key)
    },
    clear: () => store.clear(),
    key: () => null,
    length: 0,
  })
  vi.stubGlobal('sessionStorage', {
    getItem: () => null,
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
    key: () => null,
    length: 0,
  })
}

describe('api client refresh', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.resetModules()
    mockLocalStorage()
  })

  it('retries request after silent refresh on 401', async () => {
    const { useAuthStore } = await import('@/lib/store/authStore')
    useAuthStore.setState({
      token: 'old-access',
      refreshToken: 'old-refresh',
      userId: 'user-1',
      isAuthenticated: true,
      hasHydrated: true,
    })

    mockFetch
      .mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({ error: 'expired' }),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          accessToken: 'new-access',
          refreshToken: 'new-refresh',
          userId: 'user-1',
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ data: 'ok' }),
      })

    const { apiFetch } = await import('@/lib/api/client')
    const result = await apiFetch<{ data: string }>('/dashboard', {
      headers: { Authorization: 'Bearer old-access' },
    })

    expect(result.data).toBe('ok')
    expect(useAuthStore.getState().token).toBe('new-access')
    expect(mockFetch).toHaveBeenCalledTimes(3)
  })
})
