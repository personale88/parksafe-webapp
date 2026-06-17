'use client'

import { WifiOff, Phone } from 'lucide-react'
import { useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { track } from '@/lib/utils/analytics'

/**
 * PWA offline screen — rendered by the service worker when network is unavailable.
 * Always shows the emergency call CTA (112) — no network required to dial.
 * Cached vehicle info would render here in a future iteration using Service Worker cache API.
 */
export default function OfflinePage() {
  const t = useTranslations()
  useEffect(() => {
    track({ event: 'offline_screen_shown', properties: {} })
  }, [])

  return (
    <main className="mx-auto flex min-h-screen max-w-page flex-col items-center justify-center gap-8 px-4 py-16">
      <div className="flex flex-col items-center gap-4 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-neutral-100">
          <WifiOff className="h-8 w-8 text-neutral-400" aria-hidden="true" />
        </div>
        <div className="flex flex-col gap-2">
          <h1 className="text-xl font-bold text-neutral-900">{t('OFFLINE_TITLE')}</h1>
          <p className="text-sm text-neutral-600">{t('OFFLINE_BODY')}</p>
        </div>
      </div>

      {/* Emergency CTA — always functional offline, uses native tel: protocol */}
      <a
        href="tel:112"
        className="flex min-h-touch w-full max-w-xs items-center justify-center gap-3 rounded-button bg-emergency px-6 text-base font-semibold text-white shadow-md"
        aria-label={t('ARIA_EMERGENCY_CALL')}
      >
        <Phone className="h-5 w-5" aria-hidden="true" />
        {t('OFFLINE_EMERGENCY_CTA')}
      </a>

      <p className="text-xs text-neutral-400">{t('OFFLINE_CACHED_HINT')}</p>
    </main>
  )
}
