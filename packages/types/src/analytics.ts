/** Analytics flows — no PII in any event property. */
export type AnalyticsFlow = 'register' | 'sign_in'

/**
 * Server-side PostHog events (source of truth for backend actions).
 * All captures include `source: 'api'` at send time.
 */
export type ServerAnalyticsEvent =
  | { event: 'contact_sent'; properties: { channel: string; issueType: string } }
  | { event: 'contact_failed'; properties: { channel: string; issueType: string; status: number } }
  | { event: 'registration_completed'; properties: { tagLinked: boolean } }
  | { event: 'sign_in_completed'; properties: Record<string, never> }
  | { event: 'otp_verified'; properties: { flow: AnalyticsFlow } }
  | { event: 'otp_failed'; properties: { flow: AnalyticsFlow } }
  | { event: 'tag_activated'; properties: Record<string, never> }
  | { event: 'admin_batch_completed'; properties: { tagCount: number } }
  | { event: 'admin_batch_failed'; properties: { tagCount: number } }
