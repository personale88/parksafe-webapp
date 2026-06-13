import type { Metadata } from 'next'
import { ContactIssueStep } from '@/components/contact/ContactIssueStep'
import { ContactStatusScreen } from '@/components/contact/ContactStatusScreen'
import { resolveContactTag } from '@/lib/contact/resolveContactTag'
import { routes } from '@/lib/routes'
import { en } from '@/content/en'

export const metadata: Metadata = {
  title: en.META_CONTACT_TITLE,
  description: en.META_CONTACT_DESCRIPTION,
  robots: { index: false, follow: false },
}

interface Props {
  params: Promise<{ tagId: string }>
}

/** /contact/[tagId] — Step 1 */
export default async function ContactTagIssuePage({ params }: Props) {
  const { tagId } = await params
  const result = await resolveContactTag(tagId)
  const basePath = `/contact/${tagId}`

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
    <ContactIssueStep tagId={data.tagId} basePath={basePath} vehicle={data.vehicle} />
  )
}
