/**
 * In-memory Redis substitute for local development (OTP_DEV_MODE).
 * Implements only the commands used by otp.service and rate limiting.
 */

interface MemoryEntry {
  value: string
  expiresAt?: number
}

export function createInMemoryRedis() {
  const store = new Map<string, MemoryEntry>()

  return {
    async get<T>(key: string): Promise<T | null> {
      const entry = store.get(key)
      if (!entry) return null
      if (entry.expiresAt !== undefined && Date.now() > entry.expiresAt) {
        store.delete(key)
        return null
      }
      return entry.value as T
    },

    async setex(key: string, ttlSeconds: number, value: string): Promise<'OK'> {
      store.set(key, { value, expiresAt: Date.now() + ttlSeconds * 1000 })
      return 'OK'
    },

    async del(...keys: string[]): Promise<number> {
      let count = 0
      for (const key of keys) {
        if (store.delete(key)) count++
      }
      return count
    },

    async incr(key: string): Promise<number> {
      const entry = store.get(key)
      const next = entry ? parseInt(entry.value, 10) + 1 : 1
      const updated: MemoryEntry = { value: String(next) }
      if (entry?.expiresAt !== undefined) {
        updated.expiresAt = entry.expiresAt
      }
      store.set(key, updated)
      return next
    },

    async expire(key: string, ttlSeconds: number): Promise<number> {
      const entry = store.get(key)
      if (!entry) return 0
      entry.expiresAt = Date.now() + ttlSeconds * 1000
      store.set(key, entry)
      return 1
    },

    async ttl(key: string): Promise<number> {
      const entry = store.get(key)
      if (!entry) return -2
      if (entry.expiresAt === undefined) return -1
      return Math.max(0, Math.ceil((entry.expiresAt - Date.now()) / 1000))
    },
  }
}
