/**
 * apps/web/lib/api/client.ts
 * Typed fetch wrapper — base for all API calls in the frontend.
 * All errors are typed and handled. Components never call fetch directly.
 */

/**
 * Resolves the API base URL.
 * Browser requests use the same-origin /backend proxy (avoids CSP + CORS issues).
 * Server-side calls use the direct API URL.
 */
function getApiBase(): string {
  if (typeof window !== 'undefined') {
    return '/backend'
  }
  return process.env['NEXT_PUBLIC_API_URL'] ?? 'http://localhost:3001'
}

/** Typed API error — carries HTTP status and optional error code. */
export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly code?: string
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

interface FetchOptions extends Omit<RequestInit, 'body'> {
  body?: Record<string, unknown>
  /** Internal — prevents infinite refresh retry loops */
  _skipRefresh?: boolean
}

let refreshInFlight: Promise<boolean> | null = null

/**
 * Attempts a silent token refresh using the stored refresh token.
 * Returns true if the access token was updated.
 */
async function trySilentRefresh(): Promise<boolean> {
  if (typeof window === 'undefined') return false

  const { useAuthStore } = await import('@/lib/store/authStore')
  const { refreshToken, updateAccessToken, clearSession } = useAuthStore.getState()

  if (!refreshToken) return false

  if (!refreshInFlight) {
    refreshInFlight = (async () => {
      try {
        const result = await rawApiFetch<{
          accessToken: string
          refreshToken: string
          userId: string
        }>('/auth/refresh', {
          method: 'POST',
          body: { refreshToken },
        })
        updateAccessToken(result.accessToken, result.refreshToken)
        return true
      } catch {
        clearSession()
        return false
      } finally {
        refreshInFlight = null
      }
    })()
  }

  return refreshInFlight
}

/**
 * Low-level fetch without 401 refresh retry — used by auth endpoints.
 */
export async function rawApiFetch<T>(path: string, options: FetchOptions = {}): Promise<T> {
  const { body, headers, _skipRefresh: _, ...rest } = options

  const init: RequestInit = {
    ...rest,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
  }
  if (body !== undefined) {
    init.body = JSON.stringify(body)
  }

  const res = await fetch(`${getApiBase()}${path}`, init)

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ error: 'Unknown error' }))
    throw new ApiError(
      (errorData as { error?: string }).error ?? `HTTP ${res.status}`,
      res.status,
      (errorData as { code?: string }).code
    )
  }

  return res.json() as Promise<T>
}

/**
 * Makes a typed fetch request to the ParkSafe API.
 * On 401, attempts one silent refresh + retry before throwing.
 */
export async function apiFetch<T>(path: string, options: FetchOptions = {}): Promise<T> {
  const { body, headers, _skipRefresh, ...rest } = options

  const buildInit = (extraHeaders?: HeadersInit): RequestInit => {
    const init: RequestInit = {
      ...rest,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
        ...extraHeaders,
      },
    }
    if (body !== undefined) {
      init.body = JSON.stringify(body)
    }
    return init
  }

  const doFetch = async (): Promise<Response> => {
    return fetch(`${getApiBase()}${path}`, buildInit())
  }

  let res = await doFetch()

  if (res.status === 401 && !_skipRefresh && typeof window !== 'undefined') {
    const refreshed = await trySilentRefresh()
    if (refreshed) {
      const { useAuthStore } = await import('@/lib/store/authStore')
      const newToken = useAuthStore.getState().token
      res = await fetch(
        `${getApiBase()}${path}`,
        buildInit(newToken ? { Authorization: `Bearer ${newToken}` } : undefined)
      )
    }
  }

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ error: 'Unknown error' }))
    throw new ApiError(
      (errorData as { error?: string }).error ?? `HTTP ${res.status}`,
      res.status,
      (errorData as { code?: string }).code
    )
  }

  return res.json() as Promise<T>
}
