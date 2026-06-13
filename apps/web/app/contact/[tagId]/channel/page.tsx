import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { ContactChannelStep } from '@/components/contact/ContactChannelStep'
import { ContactStatusScreen } from '@/components/contact/ContactStatusScreen'
import { buildContactPaths } from '@/lib/contact/paths'
import { parseIssueParam } from '@/lib/contact/parseIssue'
import { resolveContactTag } from '@/lib/contact/resolveContactTag'
import { routes } from '@/lib/routes'
import { en } from '@/content/en'

export const metadata: Metadata = {
  title: en.META_CONTACT_CHANNEL_TITLE,
  robots: { index: false, follow: false },
}

interface Props {
  params: Promise<{ tagId: string }>
  searchParams: Promise<{ issue?: string }>
}

/** /contact/[tagId]/channel?issue=… — Step 2 */
export default async function ContactTagChannelPage({ params, searchParams }: Props) {
  const { tagId } = await params
  const { issue: issueParam } = await searchParams
  const basePath = `/contact/${tagId}`
  const paths = buildContactPaths(basePath)

  const issue = parseIssueParam(issueParam)
  if (!issue) {
    redirect(paths.issue())
  }

  const result = await resolveContactTag(tagId)

  if (!result.ok) {
    if (result.reason === 'INACTIVE') {
      return (
        <ContactStatusScreen
          emoji="⏸️"
          title={en.CONTACT_TAG_INACTIVE_TITLE}
          body={en.CONTACT_TAG_INACTIVE_BODY}
        />
      )
    }

    return (
      <ContactStatusScreen
        emoji="🏷️"
        title={en.CONTACT_TAG_NOT_ACTIVATED_TITLE}
        body={en.CONTACT_TAG_NOT_ACTIVATED_BODY}
        cta={{ label: en.CONTACT_TAG_NOT_ACTIVATED_CTA, href: routes.register({ tag: tagId }) }}
      />
    )
  }

  const { data } = result

  return (
    <ContactChannelStep
      tagId={data.tagId}
      issue={issue}
      basePath={basePath}
      availableChannels={data.availableChannels}
    />
  )
}
