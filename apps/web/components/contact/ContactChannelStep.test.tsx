import { renderWithIntl } from '@/__tests__/utils/renderWithIntl'
import { screen } from '@testing-library/react'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { IssueType } from '@parksafe/types'
import { ContactChannelStep } from './ContactChannelStep'
import { useContactStore } from '@/lib/store/contactStore'

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
}))

describe('ContactChannelStep', () => {
  beforeEach(() => {
    useContactStore.getState().reset()
  })

  it('renders step 2 heading and selected issue without crashing', () => {
    renderWithIntl(
      <ContactChannelStep
        tagId="test-tag-uuid-001"
        issue={IssueType.VEHICLE_DAMAGE}
        basePath="/contact"
        availableChannels={['WHATSAPP', 'CALL']}
      />
    )

    expect(screen.getByText('Step 2 of 2')).toBeInTheDocument()
    expect(screen.getByText('How to contact?')).toBeInTheDocument()
    expect(screen.getByText('Vehicle damage')).toBeInTheDocument()
    expect(screen.getByText('Send on WhatsApp')).toBeInTheDocument()
  })
})
