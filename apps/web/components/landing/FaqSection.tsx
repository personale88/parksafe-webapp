'use client'

import { ChevronDown } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useState } from 'react'
import { cn } from '@/lib/utils/cn'

const FAQ_KEYS = [
  { q: 'LANDING_FAQ_1_Q', a: 'LANDING_FAQ_1_A' },
  { q: 'LANDING_FAQ_2_Q', a: 'LANDING_FAQ_2_A' },
  { q: 'LANDING_FAQ_3_Q', a: 'LANDING_FAQ_3_A' },
  { q: 'LANDING_FAQ_4_Q', a: 'LANDING_FAQ_4_A' },
  { q: 'LANDING_FAQ_5_Q', a: 'LANDING_FAQ_5_A' },
] as const

/** FAQ accordion — Figma node 131:1242. */
export function FaqSection() {
  const t = useTranslations()
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  return (
    <section
      id="faq"
      className="bg-gradient-to-b from-white to-register-tint px-4 py-20 lg:px-8"
    >
      <div className="mx-auto flex max-w-[768px] flex-col gap-10">
        <h2 className="text-center text-[22.7px] font-bold leading-[30px] text-black">
          {t('LANDING_FAQ_HEADING')}
        </h2>

        <div className="flex flex-col">
          {FAQ_KEYS.map(({ q, a }, index) => {
            const isOpen = openIndex === index
            return (
              <div key={q} className="border-b border-primary-500">
                <button
                  type="button"
                  className="flex w-full items-center justify-between gap-4 py-6 text-left"
                  onClick={() => setOpenIndex(isOpen ? null : index)}
                  aria-expanded={isOpen}
                >
                  <span className="text-[14.3px] leading-7 text-black">{t(q)}</span>
                  <ChevronDown
                    className={cn(
                      'size-6 shrink-0 text-primary-500 transition-transform',
                      isOpen && 'rotate-180'
                    )}
                    strokeWidth={2}
                    aria-hidden
                  />
                </button>
                {isOpen && (
                  <p className="pb-6 text-[14px] leading-6 text-slate-600">{t(a)}</p>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
