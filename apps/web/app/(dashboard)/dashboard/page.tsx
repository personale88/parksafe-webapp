import type { Metadata } from 'next'
import { DashboardContent } from '@/components/dashboard/DashboardContent'
import { DashboardHeader } from '@/components/dashboard/DashboardHeader'
import { DashboardAuthGuard } from '@/components/dashboard/DashboardAuthGuard'
import { DashboardFooter } from '@/components/dashboard/DashboardFooter'
import { en } from '@/content/en'

export const metadata: Metadata = {
  title: en.META_DASHBOARD_TITLE,
  description: en.META_DASHBOARD_DESCRIPTION,
}

/**
 * /dashboard — Owner hub with driving score, stats, vehicles, and rewards.
 */
export default function DashboardPage() {
  return (
    <DashboardAuthGuard>
      <main className="mx-auto flex min-h-screen max-w-page flex-col bg-gradient-to-b from-white via-white to-neutral-50 px-4 py-8">
        <DashboardHeader />
        <DashboardContent />
        <DashboardFooter />
      </main>
    </DashboardAuthGuard>
  )
}
