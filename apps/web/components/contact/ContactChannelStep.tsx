'use client'

import { useEffect, useMemo } from 'react'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { ChannelType, type IssueType } from '@parksafe/types'
import { useContactStore } from '@/lib/store/contactStore'
import { buildContactPaths } from '@/lib/contact/paths'
import { useTranslations } from 'next-intl'
import { ContactFlowShell } from './ContactFlowShell'
import { SelectedIssueCard } from './SelectedIssueCard'
import { ChannelSelector } from './ChannelSelector'

interface ContactChannelStepProps {
  tagId: string
  issue: IssueType
  basePath: string
  availableChannels: Array<'WHATSAPP' | 'CALL'>
}

/** Step 2 — channel selection (`/contact/channel` or `/contact/[tagId]/channel`). */
export function ContactChannelStep({
  tagId,
  issue,
  basePath,
  availableChannels,
}: ContactChannelStepProps) {
  const t = useTranslations()
  const paths = useMemo(() => buildContactPaths(basePath), [basePath])

  const channelTypes = useMemo(
    () => availableChannels.map(c => ChannelType[c]),
    [availableChannels]
  )

  useEffect(() => {
    const { setTagId, selectIssue } = useContactStore.getState()
    setTagId(tagId)
    selectIssue(issue)
  }, [tagId, issue])

  return (
    <ContactFlowShell step={2}>
      <Link
        href={paths.issue()}
        className="flex items-center gap-2 text-sm font-medium text-neutral-600"
      >
        <span className="flex size-8 items-center justify-center rounded-full bg-neutral-50">
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        </span>
        {t('CONTACT_BACK_TO_ISSUES')}
      </Link>

      <SelectedIssueCard issueType={issue} />

      <ChannelSelector
        tagId={tagId}
        issue={issue}
        successPath={paths.success()}
        availableChannels={channelTypes}
      />
    </ContactFlowShell>
  )
}
