/**
 * ParkSafe Terms of Service — English (India).
 * Review with qualified legal counsel before production reliance.
 */

import type { LegalDocumentMeta } from './types'

export const termsOfService = {
  lastUpdated: '29 May 2026',
  effectiveDate: '29 May 2026',
  companyLegalName: 'tribly tech pvt ltd',
  productName: 'ParkSafe',
  websiteUrl: 'https://parksafe.tribly.ai',
  supportEmail: 'support@parksafe.app',
  sections: [
    {
      id: 'introduction',
      title: '1. Agreement to these Terms',
      paragraphs: [
        'These Terms of Service ("Terms") govern your access to and use of the ParkSafe website, mobile web application, QR tag services, and related features (collectively, the "Service") operated by tribly tech pvt ltd ("we", "us", or "our").',
        'By accessing or using the Service, creating an account, registering a vehicle, scanning a ParkSafe QR tag, or sending an alert, you agree to be bound by these Terms and our Privacy Policy. If you do not agree, do not use the Service.',
      ],
    },
    {
      id: 'definitions',
      title: '2. Definitions',
      bullets: [
        '"Owner" means a user who registers a vehicle and links it to a ParkSafe QR tag to receive alerts.',
        '"Reporter" means a person who scans a ParkSafe QR tag or otherwise uses the Service to send an alert about a parked vehicle.',
        '"Alert" means a vehicle-related notification sent through the Service (for example: blocking vehicle, lights on, wrong parking, or emergency).',
        '"QR tag" means a physical or digital ParkSafe identifier associated with a registered vehicle.',
        '"You" means any person using the Service, whether as an Owner, Reporter, or visitor.',
      ],
    },
    {
      id: 'eligibility',
      title: '3. Eligibility',
      paragraphs: [
        'You must be at least 18 years of age and capable of entering into a binding contract under applicable law to use the Service as an account holder or registered Owner.',
        'Reporters who use the Service without creating an account must still comply with these Terms. Where local law requires parental consent for minors, a parent or guardian must supervise use.',
        'You represent that the information you provide is accurate and that you will keep it up to date.',
      ],
    },
    {
      id: 'service',
      title: '4. Description of the Service',
      paragraphs: [
        'ParkSafe enables communication about parked vehicles through QR tags. Reporters can send Alerts to Owners using channels the Owner has enabled (such as WhatsApp or phone call where available).',
        'The Service is designed so that Reporters can contact Owners without the Owner seeing the Reporter\'s phone number in the alert flow. Owners see the issue type and delivery channel, not Reporter identity, unless otherwise disclosed by law or with consent.',
        'We may update, suspend, or discontinue features of the Service at any time. We do not guarantee uninterrupted availability, delivery of messages, or that every alert will reach an Owner in real time.',
      ],
    },
    {
      id: 'accounts',
      title: '5. Accounts and authentication',
      bullets: [
        'Owners authenticate using a mobile number and one-time password (OTP). You are responsible for keeping access to your phone secure.',
        'You must not share your account credentials or allow others to use your account except as you expressly authorise.',
        'You must notify us promptly at support@parksafe.app if you suspect unauthorised access to your account.',
        'We may suspend or terminate accounts that violate these Terms or pose a security or abuse risk.',
      ],
    },
    {
      id: 'registration',
      title: '6. Vehicle and QR tag registration',
      paragraphs: [
        'To register as an Owner, you must provide accurate vehicle details (including make, model, colour, and licence plate) and link your vehicle to a valid ParkSafe QR tag.',
        'You represent that you are the owner or authorised user of the vehicle you register and that you have the right to receive alerts on behalf of that vehicle.',
        'You may deactivate a vehicle or pause notifications through your account settings. You remain responsible for alerts sent before deactivation.',
      ],
    },
    {
      id: 'reporter-use',
      title: '7. Reporter use and anonymity',
      bullets: [
        'Reporters must select a genuine vehicle-related issue and use the Service only for lawful, good-faith communication about the parked vehicle.',
        'You must not use the Service to harass, threaten, stalk, defame, or send abusive, discriminatory, or sexually explicit content.',
        'Custom messages, where available, are subject to automated filtering. We may block or reject content that violates these Terms.',
        'Reporters must not impersonate others, provide false emergency reports, or misuse emergency categories.',
        'We do not guarantee anonymity against lawful disclosure (for example, court orders or cooperation with law enforcement where required by law).',
      ],
    },
    {
      id: 'owner-use',
      title: '8. Owner responsibilities',
      bullets: [
        'You are responsible for responding to Alerts in a lawful and reasonable manner.',
        'You control which notification channels are enabled for your vehicles, subject to technical and carrier limitations.',
        'You must not use information received through the Service to harass Reporters or third parties or for any purpose unrelated to resolving the parking or vehicle issue.',
        'Emergency Alerts are not a substitute for calling official emergency services (such as 112 in India). Always contact emergency services directly in life-threatening situations.',
      ],
    },
    {
      id: 'prohibited',
      title: '9. Prohibited conduct',
      paragraphs: ['You agree not to:'],
      bullets: [
        'Use the Service for any unlawful purpose or in violation of applicable traffic, parking, telecommunications, or data protection laws.',
        'Attempt to reverse engineer, scrape, overload, or interfere with the Service or its security measures.',
        'Collect or harvest data from the Service except as expressly permitted.',
        'Register vehicles you do not own or have authority to manage.',
        'Resell, sublicense, or commercially exploit the Service without our written consent.',
        'Circumvent rate limits, abuse detection, or channel restrictions.',
      ],
    },
    {
      id: 'communications',
      title: '10. Communications and third-party carriers',
      paragraphs: [
        'Alerts may be delivered via third-party WhatsApp or telephony providers. Delivery times and success depend on factors outside our control, including network coverage and Owner device settings.',
        'Standard message and data rates from your carrier may apply. We are not responsible for charges imposed by your mobile operator.',
        'We may log delivery status for reliability and abuse prevention. We do not store Reporter phone numbers in alert records shown to Owners, as described in our Privacy Policy.',
      ],
    },
    {
      id: 'privacy',
      title: '11. Privacy',
      paragraphs: [
        'Our collection and use of personal data is described in the ParkSafe Privacy Policy, available at /privacy. By using the Service, you acknowledge that you have read and understood the Privacy Policy.',
        'Vehicle licence plate data for Owners is stored securely; masked plate information may be shown to Reporters where required for the contact flow.',
      ],
    },
    {
      id: 'ip',
      title: '12. Intellectual property',
      paragraphs: [
        'The Service, including the ParkSafe name, logos, software, and content we provide, is owned by tribly tech pvt ltd or its licensors and is protected by intellectual property laws.',
        'We grant you a limited, non-exclusive, non-transferable licence to use the Service for personal, non-commercial purposes in accordance with these Terms.',
        'You must not copy, modify, or create derivative works of the Service except as permitted by law.',
      ],
    },
    {
      id: 'disclaimers',
      title: '13. Disclaimers',
      paragraphs: [
        'THE SERVICE IS PROVIDED ON AN "AS IS" AND "AS AVAILABLE" BASIS WITHOUT WARRANTIES OF ANY KIND, WHETHER EXPRESS OR IMPLIED, INCLUDING IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT.',
        'We do not warrant that Alerts will be delivered, read, or acted upon. We are not a party to disputes between Reporters and Owners and do not provide legal, insurance, or enforcement services.',
        'Any reliance on information sent through the Service is at your own risk.',
      ],
    },
    {
      id: 'liability',
      title: '14. Limitation of liability',
      paragraphs: [
        'To the maximum extent permitted by applicable law, tribly tech pvt ltd and its directors, employees, and affiliates shall not be liable for any indirect, incidental, special, consequential, or punitive damages, or for loss of profits, data, goodwill, or vehicle-related losses, arising from or related to your use of the Service.',
        'Our total aggregate liability for any claims arising out of or relating to the Service shall not exceed the greater of (a) the amount you paid us for the Service in the twelve (12) months before the claim, or (b) INR 5,000.',
        'Some jurisdictions do not allow certain limitations; in those cases, our liability is limited to the fullest extent permitted by law.',
      ],
    },
    {
      id: 'indemnity',
      title: '15. Indemnification',
      paragraphs: [
        'You agree to indemnify and hold harmless tribly tech pvt ltd from any claims, damages, losses, or expenses (including reasonable legal fees) arising from your use of the Service, your violation of these Terms, your Alerts or responses, or your violation of any third-party rights.',
      ],
    },
    {
      id: 'termination',
      title: '16. Suspension and termination',
      bullets: [
        'You may stop using the Service at any time and may request account deletion by contacting support@parksafe.app.',
        'We may suspend or terminate your access immediately if we reasonably believe you have violated these Terms, pose a security risk, or if required by law.',
        'Provisions that by their nature should survive termination (including disclaimers, limitation of liability, and indemnity) will survive.',
      ],
    },
    {
      id: 'changes',
      title: '17. Changes to these Terms',
      paragraphs: [
        'We may update these Terms from time to time. We will post the revised Terms on this page and update the "Last updated" date. Material changes may be notified through the Service or by email where appropriate.',
        'Continued use of the Service after changes take effect constitutes acceptance of the revised Terms.',
      ],
    },
    {
      id: 'law',
      title: '18. Governing law and disputes',
      paragraphs: [
        'These Terms are governed by the laws of India, without regard to conflict-of-law principles.',
        'Any dispute arising out of or relating to these Terms or the Service shall be subject to the exclusive jurisdiction of the courts in India, unless applicable consumer protection law grants you non-waivable rights to bring proceedings in another forum.',
        'You may also seek remedies through applicable consumer grievance mechanisms where eligible under Indian law.',
      ],
    },
    {
      id: 'contact',
      title: '19. Contact us',
      paragraphs: [
        'For questions about these Terms, contact tribly tech pvt ltd at support@parksafe.app or visit https://parksafe.tribly.ai.',
        'For privacy-related requests, see our Privacy Policy or email support@parksafe.app with the subject line "Privacy request".',
      ],
    },
  ],
} as const satisfies LegalDocumentMeta
