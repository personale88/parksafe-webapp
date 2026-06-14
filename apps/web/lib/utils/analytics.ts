import posthog from 'posthog-js'

/**
 * Discriminated union of all trackable analytics events.
 * Each event type has exactly the properties it needs — no extra fields allowed.
 * CRITICAL: No PII in any event or property — anonymous IDs and enum labels only.
 */
type AnalyticsEvent =
  | { event: 'qr_scanned'; properties: { tagStatus: 'ACTIVE' | 'INACTIVE' | 'UNREGISTERED' } }
  | { event: 'issue_selected'; properties: { issueType: string } }
  | { event: 'channel_selected'; properties: { channel: 'WHATSAPP' | 'CALL' } }
  | { event: 'contact_sent'; properties: { channel: string; issueType: string } }
  | { event: 'otp_requested'; properties: Record<string, never> }
  | { event: 'otp_verified'; properties: Record<string, never> }
  | { event: 'otp_failed'; properties: { attemptCount: number } }
  | { event: 'registration_step'; properties: { step: number } }
  | { event: 'tag_activated'; properties: Record<string, never> }
  | { event: 'tag_deactivated'; properties: Record<string, never> }
  | { event: 'offline_screen_shown'; properties: Record<string, never> }

/**
 * Tracks an analytics event with PostHog.
 * Safe: no PII, no phone numbers, no plates, no names.
 * No-ops during SSR and in non-production environments.
 * @param analyticsEvent - Typed event with discriminated union for safety
 */
export function track({ event, properties }: AnalyticsEvent): void {
  if (typeof window === 'undefined') return
  if (process.env['NODE_ENV'] !== 'production') return

  posthog.capture(event, properties)
}
