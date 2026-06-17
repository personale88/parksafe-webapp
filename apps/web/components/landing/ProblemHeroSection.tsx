import { getTranslations } from 'next-intl/server'
import { ProblemHeroCarousel } from './ProblemHeroCarousel'

const BULLET_KEYS = [
  'LANDING_PROBLEM_BULLET_1',
  'LANDING_PROBLEM_BULLET_2',
  'LANDING_PROBLEM_BULLET_3',
] as const

/** "Sound familiar?" problem section — Figma node 131:904. */
export async function ProblemHeroSection() {
  const t = await getTranslations()

  return (
    <section className="overflow-hidden rounded-[22px] bg-gradient-to-b from-white to-register-tint px-4 py-8 sm:px-6 sm:py-10 md:px-10 md:py-12">
      <div className="grid items-center gap-6 md:gap-10 lg:grid-cols-12 lg:gap-16">
        <div className="order-2 flex min-w-0 flex-col gap-4 sm:gap-5 lg:order-1 lg:col-span-5">
          <p className="text-[10px] font-bold uppercase tracking-[2.4px] text-slate-500 sm:text-[10.8px] sm:tracking-[2.75px]">
            {t('LANDING_PROBLEM_LABEL')}
          </p>
          <h1 className="text-[28px] font-bold leading-[34px] tracking-[-0.84px] text-black sm:text-[32px] sm:leading-[40px] md:text-[34.7px] md:leading-[43.2px] md:tracking-[-1.08px]">
            {t('LANDING_PROBLEM_HEADING')}
          </h1>
          <ul className="flex flex-col gap-2.5 sm:gap-3">
            {BULLET_KEYS.map(key => (
              <li key={key} className="flex items-start gap-3">
                <span className="mt-2.5 size-[6px] shrink-0 rounded-full bg-primary-500 sm:mt-[9px]" aria-hidden />
                <span className="text-[14px] font-medium leading-[22px] text-slate-700 sm:text-[14.8px] sm:leading-6">
                  {t(key)}
                </span>
              </li>
            ))}
          </ul>
          <div className="border-t border-slate-200 pt-3 sm:pt-2">
            <p className="text-[15px] font-bold leading-[24px] tracking-[-0.32px] text-primary-500 sm:text-[16.9px] sm:leading-[27px] sm:tracking-[-0.36px]">
              {t('LANDING_PROBLEM_SOLUTION_TITLE')}
            </p>
            <p className="text-[13px] leading-[21px] text-slate-500 sm:text-[13.1px] sm:leading-[22.5px]">
              {t('LANDING_PROBLEM_SOLUTION_BODY')}
            </p>
          </div>
        </div>
        <div className="order-1 min-w-0 lg:order-2 lg:col-span-7">
          <ProblemHeroCarousel />
        </div>
      </div>
    </section>
  )
}
