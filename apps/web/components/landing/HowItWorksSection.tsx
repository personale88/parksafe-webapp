import { Bell, ClipboardList, QrCode } from 'lucide-react'
import { getTranslations } from 'next-intl/server'

const STEPS = [
  {
    step: 1,
    icon: ClipboardList,
    titleKey: 'LANDING_HOW_STEP_1_TITLE',
    bodyKey: 'LANDING_HOW_STEP_1_BODY',
  },
  {
    step: 2,
    icon: QrCode,
    titleKey: 'LANDING_HOW_STEP_2_TITLE',
    bodyKey: 'LANDING_HOW_STEP_2_BODY',
  },
  {
    step: 3,
    icon: Bell,
    titleKey: 'LANDING_HOW_STEP_3_TITLE',
    bodyKey: 'LANDING_HOW_STEP_3_BODY',
  },
] as const

/** Three-step how-it-works — Figma node 131:1093. */
export async function HowItWorksSection() {
  const t = await getTranslations()

  return (
    <section
      id="how-it-works"
      className="bg-gradient-to-b from-white to-neutral-50 px-4 py-20 lg:px-8"
    >
      <div className="mx-auto flex max-w-[1152px] flex-col gap-14">
        <div className="flex flex-col items-center gap-2 text-center">
          <h2 className="text-[26.8px] font-bold leading-[36.4px] tracking-[-0.48px] text-black">
            {t('LANDING_HOW_IT_WORKS_HEADING')}
          </h2>
          <p className="max-w-[400px] text-[14.3px] leading-[25.6px] text-slate-500">
            {t('LANDING_HOW_IT_WORKS_SUBHEADING')}
          </p>
        </div>

        <div className="relative">
          <div
            className="absolute left-[16.67%] right-[16.67%] top-[72px] hidden border-t-2 border-dashed border-primary-500/30 lg:block"
            aria-hidden
          />

          <div className="grid gap-12 lg:grid-cols-3 lg:gap-8">
            {STEPS.map(({ step, icon: Icon, titleKey, bodyKey }) => (
              <div key={step} className="flex flex-col items-center text-center">
                <div className="relative mb-4">
                  <div
                    className="flex size-28 items-center justify-center rounded-[18px] border border-primary-500/20 shadow-sm [background:linear-gradient(135deg,#f0fdf4_0%,#dcfce7_100%)]"
                  >
                    <Icon className="size-14 text-primary-500" strokeWidth={1.25} aria-hidden />
                  </div>
                  <span
                    className="absolute -right-1 -top-1 flex size-8 items-center justify-center rounded-full bg-primary-500 text-sm font-bold text-white shadow-md"
                  >
                    {step}
                  </span>
                </div>
                <h3 className="mb-1.5 text-[17px] font-semibold leading-[27px] tracking-[-0.34px] text-black">
                  {t(titleKey)}
                </h3>
                <p className="max-w-[240px] text-[12.5px] leading-[21px] text-slate-500">{t(bodyKey)}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
