import Image from 'next/image'
import { getTranslations } from 'next-intl/server'
import { landingImages } from './landingImages'

const FEATURE_KEYS = [
  'LANDING_TAG_FEATURE_1',
  'LANDING_TAG_FEATURE_2',
  'LANDING_TAG_FEATURE_3',
] as const

function FeatureItem({ text }: { text: string }) {
  const dashIndex = text.indexOf(' — ')
  const title = dashIndex >= 0 ? text.slice(0, dashIndex) : text
  const body = dashIndex >= 0 ? text.slice(dashIndex + 3) : null

  return (
    <li className="flex items-start gap-3">
      <span
        className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-primary-500"
        aria-hidden
      >
        <span className="size-2 rounded-full bg-white" />
      </span>
      <span className="text-[14.8px] font-medium leading-6 text-neutral-900">
        {body ? (
          <>
            <span className="font-semibold">{title}</span>
            {' — '}
            {body}
          </>
        ) : (
          text
        )}
      </span>
    </li>
  )
}

/** Safe Park Tag feature block — Figma node 131:951. */
export async function TagFeatureSection() {
  const t = await getTranslations()

  return (
    <section className="relative overflow-hidden rounded-[32px] border border-green-200/50 px-6 py-16 shadow-[0_4px_24px_-4px_rgba(27,182,88,0.12)] md:px-8 md:py-16 [background:linear-gradient(154.52deg,#f0fdf4_0%,#ffffff_50%,#ecfdf5_100%)]">
      <div
        className="pointer-events-none absolute -right-48 -top-48 size-96 rounded-full bg-primary-500/[0.06] blur-[32px]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -bottom-36 -left-36 size-72 rounded-full bg-[rgba(22,163,74,0.05)] blur-[32px]"
        aria-hidden
      />

      <div className="relative grid items-center gap-10 lg:grid-cols-12 lg:gap-16">
        <div className="flex justify-center lg:col-span-5 lg:justify-start">
          <div className="relative w-full max-w-[400px]">
            <div className="relative flex aspect-square items-center justify-center rounded-[32px] border border-primary-500/20 bg-white p-10 shadow-[0_25px_50px_-12px_rgba(27,182,88,0.15)] md:p-12">
              <Image
                src={landingImages.tagProduct}
                alt=""
                width={1200}
                height={1868}
                className="h-auto w-[62%] max-w-[220px] object-contain"
                sizes="220px"
              />
            </div>
          </div>
        </div>

        <div className="flex flex-col justify-center lg:col-span-7 lg:pl-4">
          <p className="pb-4 text-[11.6px] font-bold uppercase tracking-[2.4px] text-primary-500">
            {t('LANDING_TAG_LABEL')}
          </p>
          <h2 className="pb-5 text-[33.5px] font-bold leading-[41.4px] tracking-[-1.08px] text-black">
            {t('LANDING_TAG_HEADING')}
          </h2>
          <p className="mb-4 max-w-[480px] text-[14.1px] leading-[26.4px] text-slate-600">
            {t('LANDING_TAG_BODY')}
          </p>
          <ul className="flex flex-col gap-4">
            {FEATURE_KEYS.map(key => (
              <FeatureItem key={key} text={t(key)} />
            ))}
          </ul>
        </div>
      </div>
    </section>
  )
}
