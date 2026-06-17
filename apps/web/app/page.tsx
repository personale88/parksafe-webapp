import { LandingPage } from '@/components/landing/LandingPage'

/**
 * / — Marketing landing page (Figma node 131:874).
 * Full-width layout breaks out of the app shell max-width constraint.
 */
export default function HomePage() {
  return (
    <main className="mx-auto min-h-screen w-full max-w-[1470px]">
      <LandingPage />
    </main>
  )
}
