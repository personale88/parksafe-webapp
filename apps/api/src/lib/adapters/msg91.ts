interface Msg91Options {
  /** Recipient phone in E.164 format */
  to: string
  body: string
}

interface Msg91Result {
  success: boolean
  providerMessageId?: string
  error?: string
}

/**
 * MSG91 fallback SMS adapter — used when Twilio is unavailable.
 * Acts as the secondary relay for Indian phone numbers.
 */
export const msg91Adapter = {
  /**
   * Sends an SMS via MSG91 API.
   * @param options - Recipient phone and message body
   */
  async sendSms(options: Msg91Options): Promise<Msg91Result> {
    const authKey = process.env['MSG91_AUTH_KEY']
    const senderId = process.env['MSG91_SENDER_ID'] ?? 'PRKSFE'

    if (!authKey) {
      console.error('[msg91] Missing MSG91 auth key')
      return { success: false, error: 'MSG91 not configured' }
    }

    try {
      const res = await fetch('https://api.msg91.com/api/v5/flow/', {
        method: 'POST',
        headers: {
          authkey: authKey,
          'content-type': 'application/JSON',
        },
        body: JSON.stringify({
          sender: senderId,
          // Strip +91 prefix — MSG91 expects 10-digit Indian numbers
          mobiles: options.to.replace(/^\+91/, '91'),
          message: options.body,
        }),
      })

      if (!res.ok) {
        throw new Error(`MSG91 responded with ${res.status}`)
      }

      const data = (await res.json()) as { request_id?: string }
      return {
        success: true,
        ...(data.request_id ? { providerMessageId: data.request_id } : {}),
      }
    } catch (err) {
      const error = err instanceof Error ? err.message : 'MSG91 SMS failed'
      console.error('[msg91] SMS dispatch failed:', error)
      return { success: false, error }
    }
  },
}
