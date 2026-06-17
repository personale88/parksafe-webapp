import Image from 'next/image'
import { getTranslations } from 'next-intl/server'
import { landingImages } from './landingImages'

const USE_CASES = [
  {
    number: '01',
    titleKey: 'LANDING_USE_CASE_1_TITLE',
    bodyKey: 'LANDING_USE_CASE_1_BODY',
    image: landingImages.useCases.driveway,
    imageFirst: true,
  },
  {
    number: '02',
    titleKey: 'LANDING_USE_CASE_2_TITLE',
    bodyKey: 'LANDING_USE_CASE_2_BODY',
    image: landingImages.useCases.doubleParked,
    imageFirst: false,
  },
  {
    number: '03',
    titleKey: 'LANDING_USE_CASE_3_TITLE',
    bodyKey: 'LANDING_USE_CASE_3_BODY',
    image: landingImages.useCases.headlights,
    imageFirst: true,
  },
  {
    number: '04',
    titleKey: 'LANDING_USE_CASE_4_TITLE',
    bodyKey: 'LANDING_USE_CASE_4_BODY',
    image: landingImages.useCases.reservedSpot,
    imageFirst: false,
  },
] as const

function UseCaseImage({ src }: { src: string }) {
  return (
    <div className="overflow-hidden rounded-[18px] bg-white shadow-[0_0_0_1px_#e2e8f0]">
      <div className="relative aspect-[492/328] w-full">
        <Image src={src} alt="" fill className="object-cover" sizes="(max-width: 768px) 100vw, 492px" />
      </div>
    </div>
  )
}

function UseCaseText({
  number,
  titleKey,
  bodyKey,
  t,
}: {
  number: string
  titleKey: string
  bodyKey: string
  t: Awaited<ReturnType<typeof getTranslations>>
}) {
  return (
    <div className="flex flex-col justify-center py-4">
      <p className="pb-2 text-[13.8px] font-semibold uppercase leading-[21px] tracking-[0.7px] text-primary-500">
        {number}
      </p>
      <h3 className="pb-3 text-[26.6px] font-bold leading-[38.5px] tracking-[-0.56px] text-black">
        {t(titleKey)}
      </h3>
      <p className="text-[15.1px] leading-[26.35px] text-slate-500">{t(bodyKey)}</p>
    </div>
  )
}

/** Alternating use-case rows — Figma node 131:1036. */
export async function UseCasesSection() {
  const t = await getTranslations()

  return (
    <section className="bg-white px-4 py-20 lg:px-8">
      <div className="mx-auto flex max-w-[1024px] flex-col gap-16">
        <div className="flex flex-col gap-2">
          <p className="text-[12.7px] font-semibold uppercase leading-[19.5px] tracking-[1.3px] text-primary-500">
            {t('LANDING_USE_CASES_LABEL')}
          </p>
          <h2 className="text-[30.4px] font-bold leading-[38.4px] tracking-[-0.64px] text-black">
            {t('LANDING_USE_CASES_HEADING')}
          </h2>
          <p className="max-w-[360px] text-[14.1px] leading-[25.6px] text-slate-500">
            {t('LANDING_USE_CASES_SUBHEADING')}
          </p>
        </div>

        <div className="flex flex-col gap-20">
          {USE_CASES.map(item => (
            <article
              key={item.number}
              className="grid items-center gap-10 lg:grid-cols-2 lg:gap-10"
            >
              {item.imageFirst ? (
                <>
                  <UseCaseImage src={item.image} />
                  <UseCaseText
                    number={item.number}
                    titleKey={item.titleKey}
                    bodyKey={item.bodyKey}
                    t={t}
                  />
                </>
              ) : (
                <>
                  <UseCaseText
                    number={item.number}
                    titleKey={item.titleKey}
                    bodyKey={item.bodyKey}
                    t={t}
                  />
                  <UseCaseImage src={item.image} />
                </>
              )}
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
