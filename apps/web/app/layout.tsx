import type { Metadata, Viewport } from 'next'
import localFont from 'next/font/local'
import { en } from '@/content/en'
import { QueryProvider } from '@/lib/providers/QueryProvider'
import { IntlProvider } from '@/lib/providers/IntlProvider'
import { AnalyticsProvider } from '@/lib/providers/AnalyticsProvider'
import { defaultLocale, getMessages } from '@/lib/i18n/getMessages'
import '@/styles/globals.css'

/**
 * Clash Grotesk loaded as a local font — no layout shift, no external request.
 * Font files must be present in public/fonts/ before the first build.
 * Download from: https://www.fontshare.com/fonts/clash-grotesk
 */
const clashGrotesk = localFont({
  src: [
    { path: '../public/fonts/ClashGrotesk-Regular.woff2', weight: '400', style: 'normal' },
    { path: '../public/fonts/ClashGrotesk-Medium.woff2', weight: '500', style: 'normal' },
    { path: '../public/fonts/ClashGrotesk-Semibold.woff2', weight: '600', style: 'normal' },
    { path: '../public/fonts/ClashGrotesk-Bold.woff2', weight: '700', style: 'normal' },
  ],
  variable: '--font-display',
  display: 'swap',
  preload: true,
})

export const metadata: Metadata = {
  title: {
    default: en.META_DEFAULT_TITLE,
    template: '%s | ParkSafe',
  },
  description: en.META_DEFAULT_DESCRIPTION,
  metadataBase: new URL(en.GLOBAL_SITE_URL),
  openGraph: {
    type: 'website',
    locale: 'en_IN',
    url: en.GLOBAL_SITE_URL,
    siteName: en.GLOBAL_BRAND_NAME,
    title: en.META_DEFAULT_TITLE,
    description: en.META_DEFAULT_DESCRIPTION,
  },
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: en.GLOBAL_BRAND_NAME,
  },
  robots: {
    index: true,
    follow: true,
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: 'var(--color-primary-500)',
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = defaultLocale
  const messages = getMessages(locale)

  return (
    <html lang={locale} className={clashGrotesk.variable}>
      <body className="bg-neutral-50 font-display antialiased">
        <IntlProvider locale={locale} messages={messages}>
          <QueryProvider>
            <AnalyticsProvider>
              <div className="min-h-screen">
                {children}
              </div>
            </AnalyticsProvider>
          </QueryProvider>
        </IntlProvider>
      </body>
    </html>
  )
}
