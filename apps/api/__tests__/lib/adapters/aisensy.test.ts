import { describe, it, expect } from 'vitest'
import { normalizeAisensyDestination } from '../../../src/lib/adapters/aisensy'

describe('normalizeAisensyDestination', () => {
  it('strips leading plus from E.164 numbers', () => {
    expect(normalizeAisensyDestination('+919876543210')).toBe('919876543210')
  })

  it('leaves numbers without plus unchanged', () => {
    expect(normalizeAisensyDestination('919876543210')).toBe('919876543210')
  })
})
