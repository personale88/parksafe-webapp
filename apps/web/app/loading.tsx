/**
 * Root loading skeleton — shown during initial page load and top-level navigation.
 * Matches the general page chrome to minimise layout shift.
 */
export default function RootLoading() {
  return (
    <div className="mx-auto flex min-h-screen max-w-page flex-col items-center justify-center gap-6 px-4">
      <div className="h-16 w-16 animate-pulse rounded-2xl bg-neutral-100" />
      <div className="flex flex-col items-center gap-3">
        <div className="h-5 w-32 animate-pulse rounded-md bg-neutral-100" />
        <div className="h-4 w-48 animate-pulse rounded-md bg-neutral-100" />
      </div>
    </div>
  )
}
