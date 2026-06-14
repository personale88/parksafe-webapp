import { http, HttpResponse } from 'msw'

const API_BASE = 'http://localhost:3001'

/** MSW v2 handlers for ParkSafe API endpoints used in component tests. */
export const handlers = [
  http.get(`${API_BASE}/tags/:tagId`, () => {
    return HttpResponse.json({
      tagId: 'test-tag-uuid-001',
      status: 'ACTIVE',
      vehicle: {
        make: 'Toyota',
        model: 'Camry',
        colour: 'Silver',
        platePartial: 'AB**1234',
      },
      availableChannels: ['WHATSAPP', 'CALL'],
    })
  }),

  http.post(`${API_BASE}/contact/:tagId`, async () => {
    return HttpResponse.json({ success: true, messageId: 'msg-test-001' })
  }),

  http.get(`${API_BASE}/vehicles`, () => {
    return HttpResponse.json({
      vehicles: [
        {
          id: 'vehicle-uuid-001',
          make: 'Maruti Suzuki',
          model: 'Swift',
          colour: 'Pearl White',
          plate: 'MH12AB1234',
          platePartial: 'MH**1234',
          isActive: true,
        },
        {
          id: 'vehicle-uuid-002',
          make: 'Hyundai',
          model: 'Creta',
          colour: 'Phantom Black',
          plate: 'KA05CD5678',
          platePartial: 'KA**5678',
          isActive: true,
        },
      ],
    })
  }),

  http.get(`${API_BASE}/dashboard`, () => {
    return HttpResponse.json({
      displayName: 'Aditya Kumar',
      activeVehicles: 2,
      safeDays: 945,
      reportsReceived: 4,
      vehiclesReported: 3,
      rewards: [
        {
          id: 'zero-reports',
          title: 'Clean record',
          description: 'No alerts received on your vehicles',
          unlocked: false,
          progress: 60,
        },
        {
          id: 'safe-30',
          title: '30-day safe driver',
          description: 'Drive safely for 30 days straight',
          unlocked: true,
          progress: 100,
        },
        {
          id: 'safe-90',
          title: '90-day safe driver',
          description: 'Drive safely for 90 days straight',
          unlocked: true,
          progress: 100,
        },
        {
          id: 'community-helper',
          title: 'Community helper',
          description: 'Send alerts for 5 vehicles to help fellow drivers',
          unlocked: false,
          progress: 60,
        },
      ],
      recentContacts: [],
    })
  }),

  http.get(`${API_BASE}/profile`, () => {
    return HttpResponse.json({
      profile: {
        id: '00000000-0000-0000-0000-000000000010',
        displayName: 'Aditya Kumar',
        email: 'aditya@tribly.ai',
      },
    })
  }),

  http.get(`${API_BASE}/profile/settings`, () => {
    return HttpResponse.json({
      settings: {
        notifyWhatsapp: true,
        marketingEmails: false,
      },
    })
  }),

  http.get(`${API_BASE}/dashboard/reports/received`, () => {
    return HttpResponse.json({
      events: [
        {
          id: 'received-event-001',
          issueType: 'WRONG_PARKING',
          issueLabel: 'Wrong parking',
          channel: 'WHATSAPP',
          createdAt: new Date(Date.now() - 1 * 86_400_000).toISOString(),
          vehicle: {
            make: 'Maruti Suzuki',
            model: 'Swift',
            colour: 'Pearl White',
            plate: 'MH12AB1234',
            platePartial: 'MH**1234',
          },
        },
        {
          id: 'received-event-002',
          issueType: 'LIGHTS_ON',
          issueLabel: 'Lights on',
          channel: 'WHATSAPP',
          createdAt: new Date(Date.now() - 3 * 86_400_000).toISOString(),
          vehicle: {
            make: 'Hyundai',
            model: 'Creta',
            colour: 'Phantom Black',
            plate: 'KA05CD5678',
            platePartial: 'KA**5678',
          },
        },
        {
          id: 'received-event-003',
          issueType: 'DOOR_OPEN',
          issueLabel: 'Door open',
          channel: 'WHATSAPP',
          createdAt: new Date(Date.now() - 7 * 86_400_000).toISOString(),
          vehicle: {
            make: 'Maruti Suzuki',
            model: 'Swift',
            colour: 'Pearl White',
            plate: 'MH12AB1234',
            platePartial: 'MH**1234',
          },
        },
        {
          id: 'received-event-004',
          issueType: 'BLOCKING_VEHICLE',
          issueLabel: 'Blocking vehicle',
          channel: 'CALL',
          createdAt: new Date(Date.now() - 14 * 86_400_000).toISOString(),
          vehicle: {
            make: 'Hyundai',
            model: 'Creta',
            colour: 'Phantom Black',
            plate: 'KA05CD5678',
            platePartial: 'KA**5678',
          },
        },
      ],
    })
  }),

  http.get(`${API_BASE}/dashboard/reports/sent`, () => {
    return HttpResponse.json({
      events: [
        {
          id: 'sent-event-001',
          issueType: 'WRONG_PARKING',
          issueLabel: 'Wrong parking',
          channel: 'WHATSAPP',
          createdAt: new Date(Date.now() - 2 * 86_400_000).toISOString(),
          vehicle: {
            make: 'Honda',
            model: 'City',
            colour: 'Silver',
            platePartial: 'DL**9012',
          },
        },
        {
          id: 'sent-event-002',
          issueType: 'BLOCKING_VEHICLE',
          issueLabel: 'Blocking vehicle',
          channel: 'WHATSAPP',
          createdAt: new Date(Date.now() - 5 * 86_400_000).toISOString(),
          vehicle: {
            make: 'Tata',
            model: 'Nexon',
            colour: 'Red',
            platePartial: 'MH**4455',
          },
        },
        {
          id: 'sent-event-003',
          issueType: 'LIGHTS_ON',
          issueLabel: 'Lights on',
          channel: 'WHATSAPP',
          createdAt: new Date(Date.now() - 12 * 86_400_000).toISOString(),
          vehicle: {
            make: 'Toyota',
            model: 'Innova',
            colour: 'White',
            platePartial: 'KA**7788',
          },
        },
      ],
    })
  }),
]
