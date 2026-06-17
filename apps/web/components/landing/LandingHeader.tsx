import Image from 'next/image'
import Link from 'next/link'
import { getTranslations } from 'next-intl/server'
import { routes } from '@/lib/routes'
import { landingImages } from './landingImages'

const NAV_LINKS = [
  { key: 'LANDING_NAV_HOW_IT_WORKS', href: '#how-it-works' },
  { key: 'LANDING_NAV_ADVANTAGES', href: '#advantages' },
  { key: 'LANDING_NAV_FAQ', href: '#faq' },
  { key: 'LANDING_NAV_SUPPORT', href: routes.dashboardProfileHelp },
] as const

/** Sticky glassmorphism header — Figma node 131:876. */
export async function LandingHeader() {
  const t = await getTranslations()

  return (
    <header className="sticky top-0 z-20 w-full backdrop-blur-[6px] bg-white/40 px-4 py-4 lg:px-[287px]">
      <div className="mx-auto flex max-w-[896px] items-center justify-center p-4">
        <div
          className="relative flex w-full items-center justify-between overflow-hidden rounded-full border border-primary-500/40 px-[21px] py-[15px] shadow-[0_0_0_1px_rgba(255,255,255,0.6),0_4px_0_0_rgba(27,182,88,0.4)]"
        >
          <div
            className="pointer-events-none absolute inset-0 rounded-full bg-white/70 backdrop-blur-[20px]"
            aria-hidden
          />
          <div className="pointer-events-none absolute inset-0 rounded-full shadow-[inset_0_1px_0_1px_rgba(255,255,255,0.8)]" aria-hidden />

          <Link href={routes.home} className="relative z-10 px-4">
            <span className="text-[38.1px] font-medium leading-[48px] tracking-[-0.8px] text-primary-500">
              {t('REGISTER_BRAND_WORDMARK')}
            </span>
          </Link>

          <nav className="relative z-10 hidden items-center gap-2 md:flex" aria-label="Main">
            {NAV_LINKS.map(({ key, href }) => (
              <Link
                key={key}
                href={href}
                className="rounded-[14px] px-3 py-2 text-[13.5px] font-medium leading-[21px] text-slate-600 transition-colors hover:text-neutral-900"
              >
                {t(key)}
              </Link>
            ))}
          </nav>

          <Link
            href={routes.signIn}
            className="relative z-10 flex size-10 shrink-0 items-center justify-center rounded-full"
            aria-label={t('LANDING_PROFILE_ARIA')}
          >
            <Image
              src={landingImages.iconProfile}
              alt=""
              width={40}
              height={40}
              className="size-10"
            />
          </Link>
        </div>
      </div>
    </header>
  )
}
