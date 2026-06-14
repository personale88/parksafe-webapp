import { describe, it, expect } from 'vitest'
import { IssueType, ChannelType } from '@parksafe/types'
import { parseSuccessParams } from './parseSuccessParams'

describe('parseSuccessParams', () => {
  it('parses valid success query params', () => {
    const result = parseSuccessParams({
      issue: IssueType.BLOCKING_VEHICLE,
      channel: ChannelType.WHATSAPP,
      sentAt: '2026-05-24T06:57:00.000Z',
    })

    expect(result).toEqual({
      issue: IssueType.BLOCKING_VEHICLE,
      channel: ChannelType.WHATSAPP,
      sentAt: '2026-05-24T06:57:00.000Z',
    })
  })

  it('returns null when params are missing', () => {
    expect(parseSuccessParams({})).toBeNull()
    expect(parseSuccessParams({ issue: IssueType.EMERGENCY })).toBeNull()
  })
})
