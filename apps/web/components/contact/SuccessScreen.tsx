'use client'

import Link from 'next/link'
import { Check } from 'lucide-react'
import { motion } from 'framer-motion'
import { ChannelType, type IssueType } from '@parksafe/types'
import { useTranslations } from 'next-intl'
import { ISSUE_META } from './issueMeta'
import { formatSentTime } from '@/lib/contact/successCopy'

interface SuccessScreenProps {
  issue: IssueType
  channel: ChannelType
  sentAt: string
  homeHref?: string
}

/**
 * Post-relay success screen — Figma node 1:339.
 * Shows delivery confirmation, reported issue summary, and back navigation.
 */
export function SuccessScreen({ issue, channel, sentAt, homeHref = '/' }: SuccessScreenProps) {
  const t = useTranslations()
  const meta = ISSUE_META[issue]
  const sentTime = formatSentTime(sentAt)
  const successBody =
    channel === ChannelType.CALL
      ? t('CONTACT_SUCCESS_BODY_CALL')
      : t('CONTACT_SUCCESS_BODY_WHATSAPP')

  return (
    <section
      className="flex w-full flex-col"
      aria-live="polite"
      aria-label={t('ARIA_MESSAGE_DELIVERED')}
    >
      <div className="flex flex-col items-center pt-12">
        <motion.div
          initial={{ opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.35, ease: 'easeOut' }}
          className="relative"
        >
          <div
            className="absolute inset-0 rounded-full bg-primary-500 opacity-30 blur-[20px]"
            aria-hidden="true"
          />
          <div className="relative flex size-24 items-center justify-center rounded-full border-4 border-white bg-gradient-to-br from-primary-500 to-primary-600 shadow-success-glow">
            <Check className="size-12 text-white" strokeWidth={2.5} aria-hidden="true" />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.3 }}
          className="mt-6 flex max-w-[300px] flex-col items-center gap-3 text-center"
        >
          <h2 className="text-[26px] font-bold tracking-tight text-neutral-900">
            {t('CONTACT_SUCCESS_TITLE')}
          </h2>
          <p className="text-[15px] leading-6 text-neutral-600">
            {successBody}
          </p>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15, duration: 0.3 }}
        className="mt-8 w-full rounded-[24px] border-2 border-neutral-200 bg-gradient-to-br from-white to-neutral-50 p-[26px] shadow-sm"
      >
        <div className="flex items-center justify-between">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
            {t('CONTACT_SUCCESS_ALERT_LABEL')}
          </p>
          <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-primary-600">
            {t('CONTACT_SUCCESS_SENT_BADGE')}
          </span>
        </div>

        <div className="mt-4 flex items-center gap-4">
          <div
            className="flex size-14 shrink-0 items-center justify-center rounded-[18px] border border-neutral-200 bg-gradient-to-br from-neutral-50 to-neutral-100"
            aria-hidden="true"
          >
            <span className="text-[32px] leading-none">{meta.emoji}</span>
          </div>
          <div className="min-w-0 flex flex-col">
            <p className="text-[17px] font-bold tracking-tight text-neutral-900">{meta.label}</p>
            <div className="mt-1 flex items-center gap-1.5">
              <span className="size-1 rounded-full bg-neutral-600" aria-hidden="true" />
              <time className="text-[13px] text-neutral-600" dateTime={sentAt}>
                {sentTime}
              </time>
            </div>
          </div>
        </div>
      </motion.div>

      <div className="mt-6 w-full pt-2">
        <Link
          href={homeHref}
          className="flex min-h-[60px] w-full items-center justify-center rounded-[20px] border-2 border-neutral-200 bg-white px-[18px] text-base font-bold tracking-tight text-neutral-900 shadow-sm transition-colors hover:bg-neutral-50 active:scale-[0.99]"
        >
          {t('CONTACT_SUCCESS_BACK_HOME')}
        </Link>
      </div>
    </section>
  )
}
