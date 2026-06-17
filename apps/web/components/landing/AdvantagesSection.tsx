import {
  Bell,
  Handshake,
  Infinity,
  ShieldCheck,
  SlidersHorizontal,
  Smartphone,
  Zap,
} from 'lucide-react'
import { getTranslations } from 'next-intl/server'

const ADVANTAGES = [
  { icon: ShieldCheck, titleKey: 'LANDING_ADVANTAGE_1_TITLE', bodyKey: 'LANDING_ADVANTAGE_1_BODY' },
  { icon: Smartphone, titleKey: 'LANDING_ADVANTAGE_2_TITLE', bodyKey: 'LANDING_ADVANTAGE_2_BODY' },
  { icon: Zap, titleKey: 'LANDING_ADVANTAGE_3_TITLE', bodyKey: 'LANDING_ADVANTAGE_3_BODY' },
  { icon: Handshake, titleKey: 'LANDING_ADVANTAGE_4_TITLE', bodyKey: 'LANDING_ADVANTAGE_4_BODY' },
  { icon: Infinity, titleKey: 'LANDING_ADVANTAGE_5_TITLE', bodyKey: 'LANDING_ADVANTAGE_5_BODY' },
  { icon: SlidersHorizontal, titleKey: 'LANDING_ADVANTAGE_6_TITLE', bodyKey: 'LANDING_ADVANTAGE_6_BODY' },
] as const

/** Advantages grid — Figma node 131:1159. */
export async function AdvantagesSection() {
  const t = await getTranslations()

  return (
    <section
      id="advantages"
      className="bg-gradient-to-b from-white via-[#fafafa] to-white px-4 py-16 lg:px-8"
    >
      <div className="mx-auto flex max-w-[1152px] flex-col gap-8">
        <div className="flex flex-col items-center gap-3 text-center">
          <div
            className="flex size-16 items-center justify-center rounded-[18px] [background:linear-gradient(135deg,rgba(27,182,88,0.1)_0%,rgba(22,163,74,0.05)_100%)]"
          >
            <Bell className="size-8 text-primary-500" strokeWidth={1.5} aria-hidden />
          </div>
          <h2 className="text-[26.3px] font-bold leading-[42px] tracking-[-0.56px] text-black">
            {t('LANDING_ADVANTAGES_HEADING_PREFIX')}
            <span className="text-primary-500">{t('LANDING_ADVANTAGES_HEADING_EMPHASIS')}</span>
          </h2>
          <p className="max-w-[320px] text-[13.6px] leading-6 text-gray-500">
            {t('LANDING_ADVANTAGES_SUBHEADING')}
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {ADVANTAGES.map(({ icon: Icon, titleKey, bodyKey }) => (
            <article
              key={titleKey}
              className="rounded-[18px] border border-gray-200 bg-white p-5 shadow-sm"
            >
              <div className="flex flex-col gap-3">
                <div
                  className="flex size-10 items-center justify-center rounded-[10px] border border-primary-500/20 [background:linear-gradient(135deg,#f0fdf4_0%,#dcfce7_100%)]"
                >
                  <Icon className="size-5 text-primary-500" strokeWidth={1.75} aria-hidden />
                </div>
                <div className="flex flex-col gap-1.5">
                  <h3 className="text-[16.5px] font-semibold leading-[25.5px] tracking-[-0.34px] text-neutral-900">
                    {t(titleKey)}
                  </h3>
                  <p className="text-[12.6px] leading-[21px] text-gray-500">{t(bodyKey)}</p>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
