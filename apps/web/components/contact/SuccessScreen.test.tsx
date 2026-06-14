import { renderWithIntl } from '@/__tests__/utils/renderWithIntl'
import { screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { IssueType, ChannelType } from '@parksafe/types'
import { SuccessScreen } from './SuccessScreen'

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => (
      <div {...props}>{children}</div>
    ),
  },
}))

describe('SuccessScreen', () => {
  it('renders Figma success layout with issue and channel copy', () => {
    renderWithIntl(
      <SuccessScreen
        issue={IssueType.BLOCKING_VEHICLE}
        channel={ChannelType.WHATSAPP}
        sentAt="2026-05-24T06:57:00.000Z"
      />
    )

    expect(screen.getByText('✓ Message Delivered')).toBeInTheDocument()
    expect(screen.getByText(/notified via WhatsApp/i)).toBeInTheDocument()
    expect(screen.getByText('Alert sent')).toBeInTheDocument()
    expect(screen.getByText('Blocking my vehicle')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Back to Home' })).toHaveAttribute('href', '/')
  })
})
