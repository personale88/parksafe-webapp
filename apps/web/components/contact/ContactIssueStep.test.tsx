import { renderWithIntl } from '@/__tests__/utils/renderWithIntl'
import { screen } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ContactIssueStep } from './ContactIssueStep'

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
}))

describe('ContactIssueStep', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders step 1 heading and vehicle card', () => {
    renderWithIntl(
      <ContactIssueStep
        tagId="test-tag-uuid-001"
        basePath="/contact/test-tag-uuid-001"
        vehicle={{
          make: 'Toyota',
          model: 'Camry',
          colour: 'Silver',
          platePartial: 'AB**1234',
        }}
      />
    )

    expect(screen.getByText('Step 1 of 2')).toBeInTheDocument()
    expect(screen.getByText('Toyota')).toBeInTheDocument()
    expect(screen.getByText('Camry')).toBeInTheDocument()
    expect(screen.getByText("What's the issue?")).toBeInTheDocument()
  })
})
