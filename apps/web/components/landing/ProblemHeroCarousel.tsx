'use client'

import Image from 'next/image'
import { useCallback, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { landingImages } from './landingImages'

const SLIDES = landingImages.heroCarousel

/** Hero image carousel with dot navigation — Figma node 131:928. */
export function ProblemHeroCarousel() {
  const [active, setActive] = useState(0)
  const count = SLIDES.length

  const goTo = useCallback(
    (index: number) => {
      setActive((index + count) % count)
    },
    [count]
  )

  return (
    <div className="flex w-full min-w-0 max-w-full flex-col items-center gap-3 sm:gap-4">
      <div className="relative aspect-[561/351] w-full max-w-full overflow-hidden rounded-[20px] border border-slate-200 bg-slate-100 shadow-[0_16px_32px_-12px_rgba(15,23,42,0.08)] sm:rounded-[32px] sm:shadow-[0_24px_48px_-12px_rgba(15,23,42,0.08)]">
        {SLIDES.map((src, index) => (
          <div
            key={src}
            className="absolute inset-0 transition-opacity duration-300"
            style={{ opacity: index === active ? 1 : 0 }}
            aria-hidden={index !== active}
          >
            <Image
              src={src}
              alt=""
              fill
              className="object-cover"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 90vw, 560px"
              priority={index === 0}
            />
          </div>
        ))}

        <button
          type="button"
          onClick={() => goTo(active - 1)}
          className="absolute left-2 top-1/2 flex size-9 -translate-y-1/2 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-sm transition-opacity hover:bg-black/50 sm:size-10"
          aria-label="Previous image"
        >
          <ChevronLeft className="size-4 sm:size-5" strokeWidth={2} />
        </button>
        <button
          type="button"
          onClick={() => goTo(active + 1)}
          className="absolute right-2 top-1/2 flex size-9 -translate-y-1/2 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-sm transition-opacity hover:bg-black/50 sm:size-10"
          aria-label="Next image"
        >
          <ChevronRight className="size-4 sm:size-5" strokeWidth={2} />
        </button>
      </div>

      <div className="flex items-center justify-center gap-2" role="tablist" aria-label="Problem images">
        {SLIDES.map((_, index) => (
          <button
            key={index}
            type="button"
            role="tab"
            aria-selected={index === active}
            aria-label={`Go to problem image ${index + 1}`}
            onClick={() => goTo(index)}
            className={
              index === active
                ? 'h-2 w-6 rounded-full bg-primary-500'
                : 'size-2 rounded-full bg-slate-200'
            }
          />
        ))}
      </div>
    </div>
  )
}
