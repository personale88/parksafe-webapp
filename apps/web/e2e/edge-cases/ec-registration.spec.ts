import { test, expect } from '@playwright/test'
import {
  API_BASE,
  createFreshTag,
  getTagInfo,
  registerTagViaApi,
  requestDevOtp,
  uniquePhone,
} from './helpers'

test.describe('EC-Registration: tag activation', () => {
  test('EC-019: registration activates tag to ACTIVE', async ({ request }) => {
    const tagCode = await createFreshTag(request)
    await registerTagViaApi(request, tagCode)
    const tag = await getTagInfo(request, tagCode)
    expect(tag.ok).toBe(true)
    if (tag.ok) expect(tag.data.status).toBe('ACTIVE')
  })

  test('EC-020: activated tag returns masked vehicle make/model', async ({ request }) => {
    const tagCode = await createFreshTag(request)
    await registerTagViaApi(request, tagCode, { make: 'Toyota', plate: 'KA01CD1234' })
    const tag = await getTagInfo(request, tagCode)
    expect(tag.ok).toBe(true)
    if (tag.ok) {
      expect(tag.data.vehicle.make).toBe('Toyota')
      expect(tag.data.vehicle.platePartial).toMatch(/KA\*\*/)
    }
  })

  test('EC-021: registration without tagCode leaves tag UNREGISTERED', async ({ request }) => {
    const tagCode = await createFreshTag(request)
    const phone = uniquePhone()
    const otp = await requestDevOtp(request, phone)
    const res = await request.post(`${API_BASE}/registration`, {
      data: {
        plate: 'MH12AB8888',
        make: 'Honda',
        model: 'City',
        colour: 'Black',
        vehicleType: 'CAR',
        ownerName: 'No Tag Owner',
        ownerPhone: phone,
        emergencyName: 'Emergency',
        emergencyPhone: '9876543211',
        whatsappEnabled: true,
        consent: true,
        otp,
      },
    })
    expect(res.status()).toBe(201)
    const tag = await getTagInfo(request, tagCode)
    expect(tag.ok).toBe(true)
    if (tag.ok) expect(tag.data.status).toBe('UNREGISTERED')
  })

  test('EC-022: invalid tagCode UUID rejected by schema', async ({ request }) => {
    const phone = uniquePhone()
    const otp = await requestDevOtp(request, phone)
    const res = await request.post(`${API_BASE}/registration`, {
      data: {
        plate: 'MH12AB7777',
        make: 'Honda',
        model: 'City',
        colour: 'Black',
        vehicleType: 'CAR',
        ownerName: 'Bad Tag',
        ownerPhone: phone,
        emergencyName: 'Emergency',
        emergencyPhone: '9876543211',
        whatsappEnabled: true,
        consent: true,
        otp,
        tagCode: 'not-a-valid-uuid',
      },
    })
    expect(res.status()).toBe(400)
  })

  test('EC-023: nonexistent tagCode — registration succeeds but tag stays unlinked', async ({
    request,
  }) => {
    const fakeTag = '00000000-0000-0000-0000-000000000099'
    const phone = uniquePhone()
    const otp = await requestDevOtp(request, phone)
    const res = await request.post(`${API_BASE}/registration`, {
      data: {
        plate: 'MH12AB6666',
        make: 'Honda',
        model: 'City',
        colour: 'Black',
        vehicleType: 'CAR',
        ownerName: 'Ghost Tag',
        ownerPhone: phone,
        emergencyName: 'Emergency',
        emergencyPhone: '9876543211',
        whatsappEnabled: true,
        consent: true,
        otp,
        tagCode: fakeTag,
      },
    })
    expect(res.status()).toBe(201)
    const tag = await getTagInfo(request, fakeTag)
    expect(tag.ok).toBe(false)
  })

  test('EC-024: duplicate phone registration returns 409', async ({ request }) => {
    const tag1 = await createFreshTag(request)
    const phone = uniquePhone()
    await registerTagViaApi(request, tag1, { phone })
    const tag2 = await createFreshTag(request)
    const otp = await requestDevOtp(request, phone)
    const res = await request.post(`${API_BASE}/registration`, {
      data: {
        plate: 'MH12AB5555',
        make: 'Honda',
        model: 'City',
        colour: 'Black',
        vehicleType: 'CAR',
        ownerName: 'Duplicate',
        ownerPhone: phone,
        emergencyName: 'Emergency',
        emergencyPhone: '9876543211',
        whatsappEnabled: true,
        consent: true,
        otp,
        tagCode: tag2,
      },
    })
    expect(res.status()).toBe(409)
    const tag = await getTagInfo(request, tag2)
    expect(tag.ok).toBe(true)
    if (tag.ok) expect(tag.data.status).toBe('UNREGISTERED')
  })

  test('EC-025: wrong OTP rejected before registration', async ({ request }) => {
    const tagCode = await createFreshTag(request)
    const phone = uniquePhone()
    await requestDevOtp(request, phone)
    const res = await request.post(`${API_BASE}/registration`, {
      data: {
        plate: 'MH12AB4444',
        make: 'Honda',
        model: 'City',
        colour: 'Black',
        vehicleType: 'CAR',
        ownerName: 'Bad OTP',
        ownerPhone: phone,
        emergencyName: 'Emergency',
        emergencyPhone: '9876543211',
        whatsappEnabled: true,
        consent: true,
        otp: '000000',
        tagCode,
      },
    })
    expect(res.status()).toBe(400)
    const tag = await getTagInfo(request, tagCode)
    expect(tag.ok).toBe(true)
    if (tag.ok) expect(tag.data.status).toBe('UNREGISTERED')
  })

  test('EC-026: ownerPhone equals emergencyPhone rejected', async ({ request }) => {
    const tagCode = await createFreshTag(request)
    const phone = uniquePhone()
    const otp = await requestDevOtp(request, phone)
    const res = await request.post(`${API_BASE}/registration`, {
      data: {
        plate: 'MH12AB3333',
        make: 'Honda',
        model: 'City',
        colour: 'Black',
        vehicleType: 'CAR',
        ownerName: 'Same Phone',
        ownerPhone: phone,
        emergencyName: 'Emergency',
        emergencyPhone: phone,
        whatsappEnabled: true,
        consent: true,
        otp,
        tagCode,
      },
    })
    expect(res.status()).toBe(400)
  })

  test('EC-027: consent=false rejected', async ({ request }) => {
    const tagCode = await createFreshTag(request)
    const phone = uniquePhone()
    const otp = await requestDevOtp(request, phone)
    const res = await request.post(`${API_BASE}/registration`, {
      data: {
        plate: 'MH12AB2222',
        make: 'Honda',
        model: 'City',
        colour: 'Black',
        vehicleType: 'CAR',
        ownerName: 'No Consent',
        ownerPhone: phone,
        emergencyName: 'Emergency',
        emergencyPhone: '9876543211',
        whatsappEnabled: true,
        consent: false,
        otp,
        tagCode,
      },
    })
    expect(res.status()).toBe(400)
  })

  test('EC-028: invalid plate format rejected', async ({ request }) => {
    const tagCode = await createFreshTag(request)
    const phone = uniquePhone()
    const otp = await requestDevOtp(request, phone)
    const res = await request.post(`${API_BASE}/registration`, {
      data: {
        plate: 'INVALID',
        make: 'Honda',
        model: 'City',
        colour: 'Black',
        vehicleType: 'CAR',
        ownerName: 'Bad Plate',
        ownerPhone: phone,
        emergencyName: 'Emergency',
        emergencyPhone: '9876543211',
        whatsappEnabled: true,
        consent: true,
        otp,
        tagCode,
      },
    })
    expect(res.status()).toBe(400)
  })

  test('EC-029: second registration cannot claim already ACTIVE tag', async ({ request }) => {
    const tagCode = await createFreshTag(request)
    await registerTagViaApi(request, tagCode, { make: 'FirstOwner' })
    const phone2 = uniquePhone()
    const otp2 = await requestDevOtp(request, phone2)
    const res = await request.post(`${API_BASE}/registration`, {
      data: {
        plate: 'MH12AB1111',
        make: 'SecondOwner',
        model: 'City',
        colour: 'White',
        vehicleType: 'CAR',
        ownerName: 'Second Owner',
        ownerPhone: phone2,
        emergencyName: 'Emergency',
        emergencyPhone: '9876543211',
        whatsappEnabled: true,
        consent: true,
        otp: otp2,
        tagCode,
      },
    })
    expect(res.status()).toBe(201)
    const tag = await getTagInfo(request, tagCode)
    expect(tag.ok).toBe(true)
    if (tag.ok) {
      expect(tag.data.status).toBe('ACTIVE')
      expect(tag.data.vehicle.make).toBe('FirstOwner')
    }
  })

  test('EC-030: activated tag exposes WhatsApp channel by default', async ({
    request,
  }) => {
    const tagCode = await createFreshTag(request)
    await registerTagViaApi(request, tagCode)
    const tag = await getTagInfo(request, tagCode)
    expect(tag.ok).toBe(true)
    if (tag.ok) {
      expect(tag.data.availableChannels).toContain('WHATSAPP')
    }
  })

  test('EC-031: activated tag does not expose CALL by default', async ({ request }) => {
    const tagCode = await createFreshTag(request)
    await registerTagViaApi(request, tagCode)
    const tag = await getTagInfo(request, tagCode)
    expect(tag.ok).toBe(true)
    if (tag.ok) {
      expect(tag.data.availableChannels).not.toContain('CALL')
    }
  })

  test('EC-032: registration returns access token and userId', async ({ request }) => {
    const tagCode = await createFreshTag(request)
    const result = await registerTagViaApi(request, tagCode)
    expect(result.accessToken).toBeTruthy()
    expect(result.userId).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    )
  })

  test('EC-033: plate whitespace normalized to uppercase', async ({ request }) => {
    const tagCode = await createFreshTag(request)
    await registerTagViaApi(request, tagCode, { plate: 'mh 12 ab 9999' })
    const tag = await getTagInfo(request, tagCode)
    expect(tag.ok).toBe(true)
    if (tag.ok) {
      expect(tag.data.vehicle.platePartial).toMatch(/MH\*\*9999/)
    }
  })
})
