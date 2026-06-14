import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { IssueType, ChannelType } from '@parksafe/types'
import { IntlTestWrapper } from '@/__tests__/utils/renderWithIntl'
import { useContactStore } from '@/lib/store/contactStore'
import { useContactFlow } from './useContactFlow'
import { sendContactMessage } from '@/lib/api/contact'
import { ApiError } from '@/lib/api/client'

const mockPush = vi.fn()

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}))

vi.mock('@/lib/api/contact', () => ({
  sendContactMessage: vi.fn(),
}))

vi.mock('@/lib/utils/analytics', () => ({
  track: vi.fn(),
}))

const TAG_ID = '00000000-0000-4000-8000-000000000001'
const SUCCESS_PATH = '/contact/success'

describe('useContactFlow', () => {
  beforeEach(() => {
    useContactStore.getState().reset()
    vi.mocked(sendContactMessage).mockReset()
    mockPush.mockReset()
    sessionStorage.clear()
  })

  it('stores selected issue without changing URL (navigation is route-driven)', () => {
    const { result } = renderHook(() => useContactFlow(), { wrapper: IntlTestWrapper })

    act(() => {
      result.current.selectIssue(IssueType.BLOCKING_VEHICLE)
    })

    expect(result.current.selectedIssue).toBe(IssueType.BLOCKING_VEHICLE)
  })

  it('maps rate limit errors from the API', async () => {
    vi.mocked(sendContactMessage).mockRejectedValue(
      new ApiError('Please wait 15 minutes before contacting this vehicle again.', 429)
    )

    const { result } = renderHook(() => useContactFlow(), { wrapper: IntlTestWrapper })

    await act(async () => {
      await result.current.submitContact({
        tagId: TAG_ID,
        issue: IssueType.BLOCKING_VEHICLE,
        channel: ChannelType.WHATSAPP,
        successPath: SUCCESS_PATH,
      })
    })

    expect(result.current.error).toMatch(/wait/i)
    expect(mockPush).not.toHaveBeenCalled()
  })

  it('navigates to success path after a successful submit', async () => {
    vi.mocked(sendContactMessage).mockResolvedValue({
      success: true,
      messageId: 'msg-1',
    })

    const { result } = renderHook(() => useContactFlow(), { wrapper: IntlTestWrapper })

    await act(async () => {
      await result.current.submitContact({
        tagId: TAG_ID,
        issue: IssueType.LIGHTS_ON,
        channel: ChannelType.WHATSAPP,
        successPath: SUCCESS_PATH,
      })
    })

    expect(mockPush).toHaveBeenCalledWith(
      expect.stringMatching(/^\/contact\/success\?issue=LIGHTS_ON&channel=WHATSAPP&sentAt=/)
    )
    expect(result.current.error).toBeNull()
  })
})
