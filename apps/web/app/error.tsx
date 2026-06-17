'use client'

import { useEffect } from 'react'
import { AlertCircle } from 'lucide-react'

interface ErrorProps {
  error: Error & { digest?: string }
  reset: () => void
}

/**
 * Root error boundary — catches unhandled errors in the component tree.
 * Shows a friendly retry UI — never a blank screen or raw error stack.
 */
export default function RootError({ error, reset }: ErrorProps) {
  useEffect(() => {
    // Log to Sentry in production — sanitised, no user data
    console.error('[error-boundary]', error.digest ?? error.message)
  }, [error])

  return (
    <main className="mx-auto flex min-h-screen max-w-page flex-col items-center justify-center gap-6 px-4 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-error-50">
        <AlertCircle className="h-8 w-8 text-error-500" aria-hidden="true" />
      </div>
      <div className="flex flex-col gap-2">
        <h1 className="text-xl font-bold text-neutral-900">Something went wrong</h1>
        <p className="text-sm text-neutral-600">
          An unexpected error occurred. Your data is safe.
        </p>
      </div>
      <button
        onClick={reset}
        className="min-h-touch rounded-button bg-primary-500 px-6 py-3 text-sm font-semibold text-white"
      >
        Try again
      </button>
    </main>
  )
}
