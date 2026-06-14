'use client'

import { LogOut, Mail, MessageCircle } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { useEffect, useState } from 'react'
import { useProfile } from '@/lib/hooks/useProfile'
import { useAuthStore } from '@/lib/store/authStore'
import { switchTrackVariants, switchThumbVariants } from '@/components/ui/switch'
import { cn } from '@/lib/utils/cn'
import { ApiError } from '@/lib/api/client'
import { routes } from '@/lib/routes'
import type { UserSettings } from '@parksafe/types'
import { DashboardSubpageShell } from './DashboardSubpageShell'
import { DashboardInfoNotice } from './alerts/DashboardSubpageListLayout'
import { NoticeSkeleton } from './alerts/DashboardListSkeleton'

interface PrefRowProps {
  icon: React.ReactNode
  label: string
  description: string
  checked: boolean
  disabled: boolean
  onToggle: () => void
  showDivider?: boolean
}

function PrefRow({
  icon,
  label,
  description,
  checked,
  disabled,
  onToggle,
  showDivider,
}: PrefRowProps) {
  return (
    <div
      className={cn(
        'flex items-center justify-between gap-3 p-4',
        showDivider && 'border-b border-neutral-200'
      )}
    >
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-neutral-100 text-neutral-600">
          {icon}
        </div>
        <div className="flex min-w-0 flex-col gap-0.5">
          <span className="text-sm font-semibold text-neutral-900">{label}</span>
          <span className="text-xs leading-relaxed text-neutral-600">{description}</span>
        </div>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={onToggle}
        className={cn(switchTrackVariants({ checked, disabled }), 'shrink-0')}
      >
        <span className={switchThumbVariants({ checked })} />
      </button>
    </div>
  )
}

function SettingsSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <NoticeSkeleton />
      <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm">
        {[1, 2].map(i => (
          <div
            key={i}
            className={cn('p-4', i < 2 && 'border-b border-neutral-200')}
          >
            <div className="h-11 animate-pulse rounded-xl bg-neutral-100" />
          </div>
        ))}
      </div>
      <div className="h-[88px] animate-pulse rounded-2xl bg-neutral-100" />
    </div>
  )
}

function SettingsFormInner() {
  const t = useTranslations()
  const router = useRouter()
  const clearSession = useAuthStore(s => s.clearSession)
  const { settings, isLoading, updateSettings, isUpdatingSettings, settingsError } = useProfile()
  const [local, setLocal] = useState<UserSettings | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (settings) setLocal(settings)
  }, [settings])

  const toggle = async (key: keyof UserSettings) => {
    if (!local) return
    setError(null)
    const previous = local
    const next = { ...local, [key]: !local[key] }
    setLocal(next)
    try {
      await updateSettings({ [key]: next[key] })
    } catch (err) {
      setLocal(previous)
      setError(err instanceof ApiError ? err.message : t('GLOBAL_ERROR_GENERIC'))
    }
  }

  if (isLoading || !local) {
    return <SettingsSkeleton />
  }

  return (
    <div className="flex flex-col gap-6" aria-label={t('DASHBOARD_SETTINGS_TITLE')}>
      <DashboardInfoNotice
        titleKey="DASHBOARD_SETTINGS_INFO_TITLE"
        bodyKey="DASHBOARD_SETTINGS_INFO_BODY"
      />

      <section className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm">
        <PrefRow
          icon={<MessageCircle className="size-5" aria-hidden />}
          label={t('DASHBOARD_SETTINGS_WHATSAPP_LABEL')}
          description={t('DASHBOARD_SETTINGS_WHATSAPP_DESC')}
          checked={local.notifyWhatsapp}
          disabled={isUpdatingSettings}
          onToggle={() => void toggle('notifyWhatsapp')}
          showDivider
        />
        <PrefRow
          icon={<Mail className="size-5" aria-hidden />}
          label={t('DASHBOARD_SETTINGS_MARKETING_LABEL')}
          description={t('DASHBOARD_SETTINGS_MARKETING_DESC')}
          checked={local.marketingEmails}
          disabled={isUpdatingSettings}
          onToggle={() => void toggle('marketingEmails')}
        />
      </section>

      {(error ?? settingsError) && (
        <p className="text-sm text-error-500" role="alert">
          {error ??
            (settingsError instanceof Error
              ? settingsError.message
              : t('GLOBAL_ERROR_GENERIC'))}
        </p>
      )}

      <button
        type="button"
        onClick={() => {
          clearSession()
          router.replace(routes.signIn)
        }}
        className={cn(
          'flex w-full items-center gap-3 rounded-2xl border border-neutral-200 bg-white p-4 text-left shadow-sm transition-colors',
          'hover:bg-neutral-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500'
        )}
      >
        <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-error-50">
          <LogOut className="size-5 text-error-500" strokeWidth={1.75} aria-hidden />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-error-500">{t('DASHBOARD_SIGN_OUT_CTA')}</p>
          <p className="text-xs leading-relaxed text-neutral-600">{t('DASHBOARD_SIGN_OUT_DESC')}</p>
        </div>
      </button>
    </div>
  )
}

export function SettingsForm() {
  const t = useTranslations()

  return (
    <DashboardSubpageShell
      title={t('DASHBOARD_SETTINGS_TITLE')}
      description={t('DASHBOARD_SETTINGS_SUBTITLE')}
      backHref={routes.dashboardProfile}
    >
      <SettingsFormInner />
    </DashboardSubpageShell>
  )
}
