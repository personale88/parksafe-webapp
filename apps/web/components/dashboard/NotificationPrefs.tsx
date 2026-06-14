'use client'

import { MessageCircle, Phone } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useTagStatus } from '@/lib/hooks/useTagStatus'
import { switchTrackVariants, switchThumbVariants } from '@/components/ui/switch'
import { cn } from '@/lib/utils/cn'
import { type ReactNode, useMemo } from 'react'

interface PrefOption {
  key: 'notifyWhatsapp' | 'callEnabled'
  label: string
  description: string
  icon: ReactNode
}

interface NotificationPrefsProps {
  tagId: string
  currentPrefs: {
    notifyWhatsapp: boolean
    callEnabled: boolean
  }
}

/**
 * Per-tag notification preference toggles for the owner dashboard.
 * Each channel can be enabled/disabled independently.
 */
export function NotificationPrefs({ tagId, currentPrefs }: NotificationPrefsProps) {
  const t = useTranslations()
  const { updatePreferences, isUpdating } = useTagStatus(tagId)

  const prefOptions = useMemo(
    (): PrefOption[] => [
      {
        key: 'notifyWhatsapp',
        label: t('CONTACT_CHANNEL_WHATSAPP_LABEL'),
        description: t('CONTACT_CHANNEL_WHATSAPP_DESC'),
        icon: <MessageCircle className="h-4 w-4" aria-hidden="true" />,
      },
      {
        key: 'callEnabled',
        label: t('CONTACT_CHANNEL_CALL_LABEL'),
        description: t('CONTACT_CHANNEL_CALL_DESC'),
        icon: <Phone className="h-4 w-4" aria-hidden="true" />,
      },
    ],
    [t]
  )

  const togglePref = async (key: keyof typeof currentPrefs) => {
    await updatePreferences({ [key]: !currentPrefs[key] })
  }

  return (
    <section aria-label={t('ARIA_NOTIFICATION_PREFS')}>
      <div className="flex flex-col gap-2">
        {prefOptions.map(option => (
          <div
            key={option.key}
            className="flex items-center justify-between rounded-xl border border-neutral-200 bg-white p-4"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-neutral-100 text-neutral-600">
                {option.icon}
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="text-sm font-semibold text-neutral-900">{option.label}</span>
                <span className="text-xs text-neutral-600">{option.description}</span>
              </div>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={currentPrefs[option.key]}
              disabled={isUpdating}
              onClick={() => void togglePref(option.key)}
              className={cn(
                switchTrackVariants({
                  checked: currentPrefs[option.key],
                  disabled: isUpdating,
                })
              )}
            >
              <span className={switchThumbVariants({ checked: currentPrefs[option.key] })} />
            </button>
          </div>
        ))}
      </div>
    </section>
  )
}
