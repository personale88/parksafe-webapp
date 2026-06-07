import twilio from 'twilio'
import { env } from '../../types/env'

const client = twilio(env.TWILIO_ACCOUNT_SID, env.TWILIO_AUTH_TOKEN)

interface SmsOptions {
  /** Recipient phone in E.164 format — owner phone passed from relay service */
  to: string
  body: string
}

interface SmsResult {
  success: boolean
  providerMessageId?: string
  error?: string
}

/**
 * Twilio SMS adapter — wraps Twilio client for SMS dispatch.
 * Phone number is passed only here — never stored or logged.
 */
export const twilioAdapter = {
  /**
   * Sends an SMS via Twilio.
   * @param options - Recipient phone and message body
   */
  async sendSms(options: SmsOptions): Promise<SmsResult> {
    try {
      const message = await client.messages.create({
        to: options.to,
        from: env.TWILIO_RELAY_NUMBER ?? '+919999999999',
        body: options.body,
      })
      return {
        success: true,
        ...(message.sid ? { providerMessageId: message.sid } : {}),
      }
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Twilio SMS failed'
      // Log sanitised error — no phone number in log output
      console.error('[twilio] SMS dispatch failed:', error)
      return { success: false, error }
    }
  },
}
