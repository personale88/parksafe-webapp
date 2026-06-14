import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock Redis before importing the service — prevents real connections in tests
vi.mock('../../src/lib/redis', () => ({
  redis: {
    get: vi.fn(),
    setex: vi.fn(),
    del: vi.fn(),
    incr: vi.fn(),
    ttl: vi.fn(),
    expire: vi.fn(),
  },
}))

vi.mock('../../src/services/whatsapp/whatsapp.service', () => ({
  whatsappService: {
    sendOtp: vi.fn().mockResolvedValue({ success: true }),
  },
}))

// Must import after mocks are set up
const { requestOtp, verifyOtp } = await import('../../src/services/otp.service')
const { redis } = await import('../../src/lib/redis')

describe('OTP Service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Default: no lockout, no stored OTP
    vi.mocked(redis.get).mockResolvedValue(null)
    vi.mocked(redis.setex).mockResolvedValue('OK')
    vi.mocked(redis.del).mockResolvedValue(1)
    vi.mocked(redis.incr).mockResolvedValue(1)
    vi.mocked(redis.ttl).mockResolvedValue(300)
  })

  describe('requestOtp', () => {
    it('returns success when no lockout exists', async () => {
      const result = await requestOtp('+919876500001')
      expect(result.success).toBe(true)
      expect(result.message).toBe('OTP sent')
    })

    it('stores OTP in Redis with 5-minute TTL', async () => {
      await requestOtp('+919876500001')
      // setex called with the otp key and 300s TTL
      expect(redis.setex).toHaveBeenCalledWith(
        expect.stringContaining('otp:code:'),
        300,
        expect.any(String)
      )
    })

    it('resets attempt counter on new OTP request', async () => {
      await requestOtp('+919876500001')
      expect(redis.del).toHaveBeenCalledWith(expect.stringContaining('otp:attempts:'))
    })

    it('returns error when account is locked', async () => {
      vi.mocked(redis.get).mockResolvedValueOnce('1') // Lock exists
      vi.mocked(redis.ttl).mockResolvedValue(600)

      const result = await requestOtp('+919876500001')
      expect(result.success).toBe(false)
      expect(result.message).toContain('locked')
      expect(result.message).toContain('10 minutes')
    })

    it('generates a 6-digit OTP', async () => {
      let capturedOtp: string | undefined
      vi.mocked(redis.setex).mockImplementation((_key, _ttl, value) => {
        capturedOtp = value as string
        return Promise.resolve('OK')
      })

      await requestOtp('+919876500001')
      expect(capturedOtp).toMatch(/^\d{6}$/)
    })
  })

  describe('verifyOtp', () => {
    it('returns valid: true on correct OTP', async () => {
      vi.mocked(redis.get).mockResolvedValueOnce('123456')
      vi.mocked(redis.incr).mockResolvedValueOnce(1)

      const result = await verifyOtp('+919876500001', '123456')
      expect(result.valid).toBe(true)
      expect(result.message).toBe('OTP verified.')
    })

    it('cleans up Redis keys on successful verification', async () => {
      vi.mocked(redis.get).mockResolvedValueOnce('123456')
      vi.mocked(redis.incr).mockResolvedValueOnce(1)

      await verifyOtp('+919876500001', '123456')
      // Both OTP and attempt keys should be deleted
      expect(redis.del).toHaveBeenCalledTimes(2)
    })

    it('returns valid: false on incorrect OTP', async () => {
      vi.mocked(redis.get).mockResolvedValueOnce('123456')
      vi.mocked(redis.incr).mockResolvedValueOnce(1)

      const result = await verifyOtp('+919876500001', '000000')
      expect(result.valid).toBe(false)
      expect(result.message).toContain('Incorrect')
      expect(result.message).toContain('2 attempts remaining')
    })

    it('locks account after 3 failed attempts', async () => {
      vi.mocked(redis.get).mockResolvedValueOnce('123456')
      vi.mocked(redis.incr).mockResolvedValueOnce(3) // 3rd failed attempt

      const result = await verifyOtp('+919876500001', '000000')
      expect(result.valid).toBe(false)
      expect(result.message).toContain('locked')
      // Lock key set with 15-minute TTL
      expect(redis.setex).toHaveBeenCalledWith(
        expect.stringContaining('otp:lock:'),
        900,
        '1'
      )
      // OTP invalidated to prevent further attempts
      expect(redis.del).toHaveBeenCalledWith(expect.stringContaining('otp:code:'))
    })

    it('returns error when OTP is expired or not requested', async () => {
      vi.mocked(redis.get).mockResolvedValueOnce(null)

      const result = await verifyOtp('+919876500001', '123456')
      expect(result.valid).toBe(false)
      expect(result.message).toContain('expired')
    })

    it('shows singular "attempt" when 1 attempt remains', async () => {
      vi.mocked(redis.get).mockResolvedValueOnce('123456')
      vi.mocked(redis.incr).mockResolvedValueOnce(2) // 2nd failed attempt → 1 remaining

      const result = await verifyOtp('+919876500001', '000000')
      expect(result.message).toContain('1 attempt remaining')
    })
  })
})
