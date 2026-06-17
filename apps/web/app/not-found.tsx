import Link from 'next/link'
import { en } from '@/content/en'
import { routes } from '@/lib/routes'

/**
 * 404 page — shown for all unmatched routes.
 * Includes a home link so users are never stranded.
 */
export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-screen max-w-page flex-col items-center justify-center gap-6 px-4 text-center">
      <div className="flex flex-col gap-2">
        <p className="text-6xl font-bold text-primary-500">404</p>
        <h1 className="text-xl font-bold text-neutral-900">{en.NOT_FOUND_TITLE}</h1>
        <p className="text-sm text-neutral-600">{en.NOT_FOUND_BODY}</p>
      </div>
      <Link
        href={routes.home}
        className="min-h-touch rounded-button bg-primary-500 px-6 py-3 text-sm font-semibold text-white"
      >
        {en.NOT_FOUND_CTA}
      </Link>
    </main>
  )
}
