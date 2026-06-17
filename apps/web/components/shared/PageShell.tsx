import { type ReactNode } from 'react'
import { getTranslations } from 'next-intl/server'

interface PageShellProps {
  children: ReactNode
}

/**
 * Wraps all reporter-facing pages with consistent padding, max-width,
 * and the ParkSafe header. No client-side logic — pure layout RSC.
 */
export async function PageShell({ children }: PageShellProps) {
  const t = await getTranslations()

  return (
    <div className="mx-auto flex min-h-screen max-w-page flex-col">
      <header className="flex items-center justify-between border-b border-neutral-200 bg-white px-4 py-3">
        <span className="text-base font-bold text-primary-500">{t('GLOBAL_BRAND_NAME')}</span>
        <span className="rounded-full bg-primary-50 px-3 py-1 text-xs font-medium text-primary-600">
          {t('CONTACT_PRIVACY_BADGE_ANONYMOUS')}
        </span>
      </header>

      <main className="flex flex-1 flex-col gap-4 px-4 py-5">{children}</main>
    </div>
  )
}
