export default function DashboardLoading() {
  return (
    <div className="mx-auto flex min-h-screen max-w-page flex-col bg-gradient-to-b from-white via-white to-neutral-50 px-4 py-8">
      <div className="flex items-center justify-between">
        <div className="h-9 w-32 animate-pulse rounded-xl bg-neutral-100" />
        <div className="flex gap-2">
          <div className="h-10 w-10 animate-pulse rounded-xl bg-neutral-100" />
          <div className="h-10 w-10 animate-pulse rounded-xl bg-neutral-100" />
        </div>
      </div>
      <div className="mt-6 flex animate-pulse flex-col gap-6">
        <div className="h-36 rounded-2xl bg-neutral-100" />
        <div className="grid grid-cols-3 gap-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-24 rounded-2xl bg-neutral-100" />
          ))}
        </div>
        <div className="h-40 rounded-2xl bg-neutral-100" />
      </div>
    </div>
  )
}
