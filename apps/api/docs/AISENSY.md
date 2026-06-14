# AiSensy WhatsApp Integration

ParkSafe sends all WhatsApp messages (OTP + contact alerts) through **AiSensy API Campaigns** when `WHATSAPP_PROVIDER=aisensy` (default).

## Prerequisites

1. WhatsApp Business API live in AiSensy dashboard
2. Templates approved in Meta/AiSensy
3. **API Campaign** created per template, status **Live**
4. API key from AiSensy dashboard
5. Wallet credits topped up

## Template → Campaign Mapping

| Template key | Env variable | Default campaign name | Category |
|---|---|---|---|
| OTP | `AISENSY_CAMPAIGN_OTP` | `ParkSafe_OTP` | AUTHENTICATION |

OTP template body in AiSensy: `{{1}} is your verification code.` with a **Copy code** URL button at index 0.

Send:
- `templateParams`: `["123456"]` — body `{{1}}`
- `buttons`: URL button index 0 with the same OTP (required for delivery)

```json
{
  "templateParams": ["123456"],
  "buttons": [
    {
      "type": "button",
      "sub_type": "url",
      "index": 0,
      "parameters": [{ "type": "text", "text": "123456" }]
    }
  ]
}
```
| Blocking vehicle | `AISENSY_CAMPAIGN_BLOCKING_VEHICLE` | `ParkSafe_Blocking` | UTILITY |
| Wrong parking | `AISENSY_CAMPAIGN_WRONG_PARKING` | `ParkSafe_WrongParking` | UTILITY |
| Lights on | `AISENSY_CAMPAIGN_LIGHTS_ON` | `ParkSafe_LightsOn` | UTILITY |
| Door open | `AISENSY_CAMPAIGN_DOOR_OPEN` | `ParkSafe_DoorOpen` | UTILITY |
| Flat tyre | `AISENSY_CAMPAIGN_FLAT_TYRE` | `ParkSafe_FlatTyre` | UTILITY |
| Fluid leaking | `AISENSY_CAMPAIGN_FLUID_LEAKING` | `ParkSafe_FluidLeaking` | UTILITY |
| Vehicle damage | `AISENSY_CAMPAIGN_VEHICLE_DAMAGE` | `ParkSafe_VehicleDamage` | UTILITY |
| Emergency | `AISENSY_CAMPAIGN_EMERGENCY` | `ParkSafe_Emergency` | UTILITY |

Registry source: `apps/api/src/services/whatsapp/template-registry.ts`

## Manual Verification (before production)

Replace placeholders and run once per campaign:

```bash
curl -X POST https://backend.aisensy.com/campaign/t1/api/v2 \
  -H "Content-Type: application/json" \
  -d '{
    "apiKey": "YOUR_AISENSY_API_KEY",
    "campaignName": "ParkSafe_OTP",
    "destination": "91YOUR_PHONE",
    "userName": "Test User",
    "source": "ParkSafe Manual Test",
    "templateParams": ["123456"],
    "buttons": [
      {
        "type": "button",
        "sub_type": "url",
        "index": 0,
        "parameters": [{ "type": "text", "text": "123456" }]
      }
    ]
  }'
```

For static contact templates, omit `templateParams` or pass reporter note as `["optional note"]` if template uses `{{1}}`.

## Adding a New Template Later

1. Add key to `WhatsAppTemplateKey` in `apps/api/src/services/whatsapp/types.ts`
2. Add entry to `TEMPLATE_REGISTRY` in `template-registry.ts`
3. Add `AISENSY_CAMPAIGN_<NAME>` to `.env.example` and production env
4. Create Live API campaign in AiSensy dashboard

No changes to `whatsapp.service.ts` required.

## Provider Switch

Set `WHATSAPP_PROVIDER=meta` to use Meta Graph API directly (template names must match Meta-approved templates).
