import { describe, it, expect, vi, beforeAll, afterAll, beforeEach } from 'vitest'
import {
  setupIntegrationDb,
  teardownIntegrationDb,
  truncateAllTables,
} from '../helpers/integration-db'
import { createUser } from '../../src/repositories/users.repository'

vi.mock('../../src/lib/redis', () => ({
  redis: {
    get: vi.fn().mockResolvedValue('123456'),
    setex: vi.fn(),
    del: vi.fn(),
    incr: vi.fn().mockResolvedValue(1),
    ttl: vi.fn(),
    expire: vi.fn(),
  },
}))

vi.mock('../../src/types/env', async importOriginal => {
  const actual = await importOriginal<typeof import('../../src/types/env')>()
  return {
    ...actual,
    isOtpDevMode: false,
  }
})

const { signInWithOtp, isPhoneRegistered, SIGN_IN_ERROR_NOT_REGISTERED } = await import(
  '../../src/services/login.service'
)

describe('login.service integration', () => {
  beforeAll(async () => {
    await setupIntegrationDb()
  })

  afterAll(async () => {
    await teardownIntegrationDb()
  })

  beforeEach(async () => {
    await truncateAllTables()
  })

  it('returns NOT_REGISTERED for unknown phone', async () => {
    const registered = await isPhoneRegistered('+919111111111')
    expect(registered).toBe(false)

    const result = await signInWithOtp('+919111111111', '123456')
    expect(result.success).toBe(false)
    expect(result.code).toBe(SIGN_IN_ERROR_NOT_REGISTERED)
  })

  it('signs in registered user with valid OTP', async () => {
    await createUser({ displayName: 'Test Owner', phoneE164: '+919876543210' })

    expect(await isPhoneRegistered('+919876543210')).toBe(true)

    const result = await signInWithOtp('+919876543210', '123456')
    expect(result.success).toBe(true)
    expect(result.accessToken).toBeTruthy()
    expect(result.refreshToken).toBeTruthy()
    expect(result.userId).toBeTruthy()
  })
})
