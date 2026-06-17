import Image from 'next/image'
import { getTranslations } from 'next-intl/server'
import { landingImages } from './landingImages'

/** Landing footer — Figma node 131:1294. */
export async function LandingFooter() {
  const t = await getTranslations()

  return (
    <footer className="relative bg-register-tint px-4 pb-8 pt-16">
      <div className="mx-auto flex max-w-[1280px] flex-col items-center">
        <Image
          src={landingImages.footerShield}
          alt=""
          width={48}
          height={48}
          className="mb-4 size-12"
        />
        <p className="text-center text-[62.3px] font-bold lowercase leading-[89.6px] text-primary-500">
          {t('REGISTER_BRAND_WORDMARK')}
        </p>
        <p className="mt-2 text-center text-[12.8px] font-medium leading-5 text-[#16a34a]">
          {t('DASHBOARD_FOOTER_TAGLINE')}
        </p>

        <div className="mt-8 w-full border-t border-[#d4edde] pt-8">
          <p className="text-center text-[13px] font-medium leading-5 text-gray-400">
            {t('DASHBOARD_FOOTER_COPYRIGHT')}
          </p>
        </div>
      </div>
    </footer>
  )
}
