'use client'

import { AlertCircle } from 'lucide-react'
import { useTranslations } from 'next-intl'

export default function DashboardError({ reset }: { error: Error; reset: () => void }) {
  const t = useTranslations()

  return (
    <div className="mx-auto flex min-h-screen max-w-page flex-col items-center justify-center gap-6 px-4 text-center">
      <AlertCircle className="h-10 w-10 text-error-500" aria-hidden="true" />
      <div className="flex flex-col gap-2">
        <h2 className="text-lg font-bold text-neutral-900">{t('DASHBOARD_ERROR_LOAD_TITLE')}</h2>
        <p className="text-sm text-neutral-600">{t('DASHBOARD_ERROR_LOAD_BODY')}</p>
      </div>
      <button
        onClick={reset}
        className="min-h-touch rounded-button bg-primary-500 px-6 py-3 text-sm font-semibold text-white"
      >
        {t('GLOBAL_ERROR_RETRY_CTA')}
      </button>
    </div>
  )
}
