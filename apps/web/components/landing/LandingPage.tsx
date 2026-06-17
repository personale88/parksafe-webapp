import { getTranslations } from 'next-intl/server'
import { AdvantagesSection } from './AdvantagesSection'
import { FaqSection } from './FaqSection'
import { HowItWorksSection } from './HowItWorksSection'
import { LandingFooter } from './LandingFooter'
import { LandingHeader } from './LandingHeader'
import { PricingSection } from './PricingSection'
import { ProblemHeroSection } from './ProblemHeroSection'
import { TagFeatureSection } from './TagFeatureSection'
import { UseCasesSection } from './UseCasesSection'

/** Full landing page — Figma node 131:874 (1470w light). */
export async function LandingPage() {
  const t = await getTranslations()

  return (
    <div className="bg-gradient-to-b from-white via-[#f8fffb] to-register-tint">
      <LandingHeader />

      <div className="mx-auto w-full max-w-[1152px] px-4 pb-10 pt-8 md:px-8">
        <div className="mb-14 flex justify-center">
          <div
            className="flex items-center gap-2 rounded-[14px] border border-[#d97706] bg-[#fffbeb] px-[17px] py-[13px] shadow-[0_4px_0_0_#d97706]"
          >
            <span className="text-base leading-6 text-[#b45309]" aria-hidden>🚨</span>
            <p className="text-[14.1px] leading-[22.4px] tracking-[-0.32px] text-[#b45309]">
              {t('LANDING_ANNOUNCEMENT')}
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-10 md:gap-20">
          <ProblemHeroSection />
          <TagFeatureSection />
          <PricingSection />
        </div>
      </div>

      <UseCasesSection />
      <HowItWorksSection />
      <AdvantagesSection />
      <FaqSection />
      <LandingFooter />
    </div>
  )
}
