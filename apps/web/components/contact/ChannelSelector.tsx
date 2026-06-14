'use client'

import { useMemo } from 'react'
import { ChevronRight, Loader2, MessageCircle, Phone } from 'lucide-react'
import { ChannelType, type IssueType } from '@parksafe/types'
import { useTranslations } from 'next-intl'
import { cva } from 'class-variance-authority'
import { useContactFlow } from '@/lib/hooks/useContactFlow'
import { cn } from '@/lib/utils/cn'
import { type ReactNode } from 'react'
import { ContactErrorBanner } from './ContactErrorBanner'

const channelCardVariants = cva(
  'flex w-full items-center gap-4 rounded-button border-2 p-[22px] text-left transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/20',
  {
    variants: {
      isAvailable: {
        true: 'cursor-pointer border-neutral-200 bg-white hover:border-primary-400 active:scale-[0.99]',
        false: 'cursor-not-allowed border-neutral-200 bg-neutral-50 opacity-50',
      },
    },
    defaultVariants: { isAvailable: true },
  }
)

interface ChannelOption {
  type: ChannelType
  label: string
  description: string
  icon: ReactNode
  iconWrapClass: string
  disabledLabel: string
}

interface ChannelSelectorProps {
  tagId: string
  issue: IssueType
  successPath: string
  availableChannels: ChannelType[]
}

/**
 * Channel selection step — tap a card to send immediately (Figma step 2).
 */
export function ChannelSelector({
  tagId,
  issue,
  successPath,
  availableChannels,
}: ChannelSelectorProps) {
  const t = useTranslations()
  const channelOptions = useMemo(
    (): ChannelOption[] => [
      {
        type: ChannelType.WHATSAPP,
        label: t('CONTACT_CHANNEL_WHATSAPP_LABEL'),
        description: t('CONTACT_CHANNEL_WHATSAPP_DESC'),
        icon: <MessageCircle className="h-5 w-5 text-primary-500" aria-hidden="true" />,
        iconWrapClass:
          'border border-primary-500/20 bg-gradient-to-br from-primary-50 to-emerald-100',
        disabledLabel: t('CONTACT_CHANNEL_WHATSAPP_DISABLED'),
      },
      {
        type: ChannelType.CALL,
        label: t('CONTACT_CHANNEL_CALL_LABEL'),
        description: t('CONTACT_CHANNEL_CALL_DESC'),
        icon: <Phone className="h-5 w-5 text-warning-500" aria-hidden="true" />,
        iconWrapClass:
          'border border-warning-500/20 bg-gradient-to-br from-warning-50 to-amber-100',
        disabledLabel: t('CONTACT_CHANNEL_CALL_DISABLED'),
      },
    ],
    [t]
  )

  const { isSubmitting, error, setError, selectChannelAndSubmit, selectedChannel } =
    useContactFlow()

  const enabledCount = channelOptions.filter(o => availableChannels.includes(o.type)).length

  return (
    <section aria-labelledby="channel-heading" className="flex flex-col gap-6">
      <h2 id="channel-heading" className="text-[22px] font-bold tracking-tight text-neutral-900">
        {t('CONTACT_CHANNEL_TITLE')}
      </h2>

      {error && <ContactErrorBanner message={error} onDismiss={() => setError(null)} />}

      {enabledCount === 0 ? (
        <p className="rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm text-neutral-600">
          {t('CONTACT_CHANNEL_NONE_AVAILABLE')}
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          {channelOptions.map(option => {
            const isAvailable = availableChannels.includes(option.type)
            const isActive = isSubmitting && selectedChannel === option.type

            return (
              <button
                key={option.type}
                type="button"
                disabled={!isAvailable || isSubmitting}
                onClick={() => {
                  if (isAvailable) {
                    void selectChannelAndSubmit({
                      tagId,
                      issue,
                      channel: option.type,
                      successPath,
                    })
                  }
                }}
                className={channelCardVariants({ isAvailable })}
              >
                <div
                  className={cn(
                    'flex size-12 shrink-0 items-center justify-center rounded-[14px]',
                    option.iconWrapClass
                  )}
                >
                  {option.icon}
                </div>
                <div className="min-w-0 flex-1 flex-col">
                  <span className="block text-base font-bold tracking-tight text-neutral-900">
                    {option.label}
                  </span>
                  <span className="mt-0.5 block text-[13px] text-neutral-600">
                    {isAvailable ? option.description : option.disabledLabel}
                  </span>
                </div>
                {isActive ? (
                  <Loader2
                    className="h-5 w-5 shrink-0 animate-spin text-primary-500"
                    aria-label={t('CONTACT_SEND_LOADING')}
                  />
                ) : (
                  <ChevronRight className="h-5 w-5 shrink-0 text-neutral-400" aria-hidden="true" />
                )}
              </button>
            )
          })}
        </div>
      )}
    </section>
  )
}
