import { IssueType } from '@parksafe/types'

interface CallOptions {
  /** Owner phone in E.164 format */
  to: string
  issueType: IssueType
}

interface CallResult {
  success: boolean
  providerCallId?: string
  error?: string
}

/**
 * Exotel call relay adapter — initiates a masked voice call.
 * The caller (reporter) and recipient (owner) never see each other's numbers.
 * Exotel acts as the intermediary — both sides call the Exotel number.
 *
 * TODO: Replace stub with real Exotel API integration when credentials are available.
 */
export const exotelAdapter = {
  /**
   * Initiates a masked call relay via Exotel.
   * @param options - Recipient phone and issue type (for IVR message selection)
   */
  async initiateCall(options: CallOptions): Promise<CallResult> {
    const exotelSid = process.env['EXOTEL_SID']
    const exotelToken = process.env['EXOTEL_TOKEN']
    const exotelCallerId = process.env['EXOTEL_CALLER_ID']

    if (!exotelSid || !exotelToken || !exotelCallerId) {
      console.error('[exotel] Missing Exotel credentials')
      return { success: false, error: 'Call relay not configured' }
    }

    const url = `https://api.exotel.com/v1/Accounts/${exotelSid}/Calls/connect`

    try {
      const params = new URLSearchParams({
        From: options.to,
        To: exotelCallerId,
        CallerId: exotelCallerId,
        // Pass issue type as a custom field for IVR routing
        CustomField: options.issueType,
      })

      const res = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: `Basic ${Buffer.from(`${exotelSid}:${exotelToken}`).toString('base64')}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params.toString(),
      })

      if (!res.ok) {
        throw new Error(`Exotel API responded with ${res.status}`)
      }

      const data = (await res.json()) as { Call?: { Sid?: string } }
      const callId = data.Call?.Sid
      return {
        success: true,
        ...(callId ? { providerCallId: callId } : {}),
      }
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Exotel call failed'
      console.error('[exotel] Call initiation failed:', error)
      return { success: false, error }
    }
  },
}
