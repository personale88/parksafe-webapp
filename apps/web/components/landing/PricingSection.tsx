import { ShoppingBag, Tag } from 'lucide-react'
import { getTranslations } from 'next-intl/server'

/** Pricing cards — Figma nodes 131:988 & 131:1011. */
export async function PricingSection() {
  const t = await getTranslations()
  const buyUrl = t('GLOBAL_BUY_URL')

  return (
    <section className="flex flex-col gap-4 md:flex-row md:justify-center">
      <article
        className="flex flex-1 flex-col gap-4 rounded-[24px] border border-[#a7f3d0] bg-white p-6 shadow-[0_4px_0_0_rgba(134,239,172,0.5)] md:max-w-[535px]"
      >
        <div className="flex size-14 items-center justify-center rounded-[18px] bg-[#ecfdf5]">
          <Tag className="size-6 text-[#22c55e]" strokeWidth={1.75} aria-hidden />
        </div>
        <div className="flex flex-col gap-1.5">
          <h3 className="text-[15px] font-semibold leading-6 tracking-[-0.32px] text-neutral-900">
            {t('LANDING_PRICING_SINGLE_TITLE')}
          </h3>
          <p className="text-[11.4px] leading-[19.5px] tracking-[-0.26px] text-gray-500">
            {t('LANDING_PRICING_SINGLE_DESC')}
          </p>
          <div className="flex items-baseline gap-2 pt-1">
            <span className="text-[17.7px] font-bold leading-[27px] text-[#22c55e]">
              {t('LANDING_PRICING_SINGLE_PRICE')}
            </span>
            <span className="text-[13.8px] leading-[21px] text-gray-400 line-through">
              {t('LANDING_PRICING_SINGLE_ORIGINAL')}
            </span>
          </div>
          <p className="text-[11.1px] font-medium leading-[18px] text-[#22c55e]">
            {t('LANDING_PRICING_LIFETIME')}
          </p>
          <a
            href={buyUrl}
            className="mt-2 inline-flex items-center gap-2 rounded bg-[#22c55e] px-4 py-2.5 text-[13.8px] font-semibold leading-[21px] text-white transition-colors hover:bg-[#16a34a]"
          >
            <ShoppingBag className="size-4" strokeWidth={2} aria-hidden />
            {t('LANDING_PRICING_BUY_NOW')}
          </a>
        </div>
      </article>

      <article
        className="relative flex flex-1 flex-col gap-4 rounded-[24px] border-2 border-[#c4b5fd] bg-white p-6 shadow-[0_4px_0_0_rgba(196,181,253,0.5)] md:max-w-[537px]"
      >
        <span
          className="absolute right-3 top-3 rounded bg-[#a78bfa] px-2.5 py-1 text-[10.5px] font-semibold uppercase leading-[16.5px] tracking-[0.275px] text-white"
        >
          {t('LANDING_PRICING_BEST_VALUE')}
        </span>
        <div className="flex size-14 items-center justify-center rounded-[18px] bg-[#f5f3ff]">
          <Tag className="size-6 text-[#8b5cf6]" strokeWidth={1.75} aria-hidden />
        </div>
        <div className="flex flex-col gap-1.5">
          <h3 className="text-[14.9px] font-semibold leading-6 tracking-[-0.32px] text-neutral-900">
            {t('LANDING_PRICING_PACK_TITLE')}
          </h3>
          <p className="text-[11.4px] leading-[19.5px] tracking-[-0.26px] text-gray-500">
            {t('LANDING_PRICING_PACK_DESC')}
          </p>
          <div className="flex items-baseline gap-2 pt-1">
            <span className="text-lg font-bold leading-[27px] text-[#8b5cf6]">
              {t('LANDING_PRICING_PACK_PRICE')}
            </span>
            <span className="text-sm leading-[21px] text-gray-400 line-through">
              {t('LANDING_PRICING_PACK_ORIGINAL')}
            </span>
          </div>
          <p className="text-[11.1px] font-medium leading-[18px] text-[#8b5cf6]">
            {t('LANDING_PRICING_LIFETIME')}
          </p>
          <a
            href={buyUrl}
            className="mt-2 inline-flex items-center gap-2 rounded bg-[#a78bfa] px-4 py-2.5 text-[13.8px] font-semibold leading-[21px] text-white transition-colors hover:bg-[#8b5cf6]"
          >
            <ShoppingBag className="size-4" strokeWidth={2} aria-hidden />
            {t('LANDING_PRICING_BUY_NOW')}
          </a>
        </div>
      </article>
    </section>
  )
}
