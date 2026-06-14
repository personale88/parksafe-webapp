/**
 * ParkSafe Privacy Policy — English (India).
 * Aligned with DPDP Act 2023 and common market practice.
 * Review with qualified legal counsel before production reliance.
 */

import type { LegalDocumentMeta } from './types'

export const privacyPolicy = {
  lastUpdated: '29 May 2026',
  effectiveDate: '29 May 2026',
  companyLegalName: 'tribly tech pvt ltd',
  productName: 'ParkSafe',
  websiteUrl: 'https://parksafe.tribly.ai',
  supportEmail: 'support@parksafe.app',
  sections: [
    {
      id: 'introduction',
      title: '1. Introduction',
      paragraphs: [
        'tribly tech pvt ltd ("we", "us", or "our") operates ParkSafe (the "Service"), which helps people communicate about parked vehicles through QR tags while limiting unnecessary sharing of personal contact details.',
        'This Privacy Policy explains how we collect, use, store, share, and protect personal data when you use our website, register a vehicle, scan a QR tag, send an alert, or manage your account.',
        'This Policy applies to users in India and is intended to align with the Digital Personal Data Protection Act, 2023 ("DPDP Act") and applicable rules. By using the Service, you acknowledge this Policy.',
      ],
    },
    {
      id: 'controller',
      title: '2. Data fiduciary and contact',
      paragraphs: [
        'For the purposes of applicable data protection law, tribly tech pvt ltd is the data fiduciary responsible for personal data processed through the Service.',
        'Privacy enquiries, access requests, correction requests, and grievances may be sent to support@parksafe.app with the subject line "Privacy request". We will respond within timelines required by applicable law.',
      ],
    },
    {
      id: 'roles',
      title: '3. Owners, Reporters, and visitors',
      bullets: [
        'Owners register vehicles, link QR tags, and receive alerts about their parked vehicles.',
        'Reporters scan QR tags and send vehicle-related alerts. Reporters may use the Service without creating an account.',
        'Visitors browse our website or marketing pages without interacting with the alert flow.',
        'The data we collect depends on how you use the Service. Reporter phone numbers are not shown to Owners in the standard alert flow.',
      ],
    },
    {
      id: 'collect',
      title: '4. Personal data we collect',
      paragraphs: ['We may collect the following categories of data:'],
      bullets: [
        'Identity and account data (Owners): display name, mobile number, optional email, account identifiers.',
        'Vehicle data (Owners): make, model, colour, full licence plate (stored encrypted), masked plate (e.g. MH**1234), QR tag association, active/inactive status.',
        'Alert data: issue type, optional filtered custom note, delivery channel, timestamp, delivery status, and masked vehicle information shown to Reporters who have an account.',
        'Reporter technical data: hashed session identifier (not the raw session ID), and if logged in, account identifier linked to alerts you sent — not your phone number in records shown to Owners.',
        'Communication metadata: WhatsApp/call routing data processed by our messaging partners to deliver alerts.',
        'Settings and preferences: notification toggles (WhatsApp, marketing emails).',
        'Technical and usage data: device/browser type, IP address, pages visited, and diagnostic logs for security and reliability.',
        'Support communications: information you provide when contacting support@parksafe.app.',
      ],
    },
    {
      id: 'not-collect',
      title: '5. What we do not collect or show',
      bullets: [
        'We do not store Reporter phone numbers in contact event records that Owners view in the app.',
        'We do not sell personal data.',
        'We do not use the Service to build advertising profiles of Reporters or Owners.',
        'We do not record phone calls made through relay features beyond what our telephony provider logs for delivery and fraud prevention, as configured.',
      ],
    },
    {
      id: 'purposes',
      title: '6. How we use personal data',
      paragraphs: ['We use personal data for the following purposes:'],
      bullets: [
        'Providing the Service: registering vehicles, delivering alerts, displaying history, and operating QR tags.',
        'Authentication and security: OTP verification, fraud prevention, abuse detection, and rate limiting.',
        'Improving reliability: monitoring delivery failures, debugging errors, and analysing aggregated usage.',
        'Communicating with you: service messages, security notices, and support responses.',
        'Marketing (with consent): product updates and tips where you have opted in via Settings.',
        'Legal compliance: responding to lawful requests and enforcing our Terms of Service.',
      ],
    },
    {
      id: 'legal-bases',
      title: '7. Legal bases for processing (India)',
      paragraphs: [
        'Under the DPDP Act, we process personal data based on one or more of the following, as applicable:',
      ],
      bullets: [
        'Your consent (for example, optional marketing emails, enabling certain channels, or registration).',
        'Performance of the Service you request (for example, delivering an alert to an Owner).',
        'Compliance with legal obligations.',
        'Legitimate uses permitted by law, such as preventing fraud or securing the Service, where consent is not required.',
      ],
    },
    {
      id: 'sharing',
      title: '8. How we share personal data',
      paragraphs: [
        'We share personal data only as necessary to operate the Service:',
      ],
      bullets: [
        'Messaging and telecom providers: to send WhatsApp or call notifications (they process data under their own policies).',
        'Cloud infrastructure providers: hosting, databases, and authentication (bound by confidentiality and security obligations).',
        'Analytics providers: privacy-oriented analytics where enabled; we disable invasive session recording by default.',
        'Professional advisers and authorities: where required by law, court order, or to protect rights, safety, and security.',
      ],
      closingParagraphs: [
        'We require service providers to process data only on our instructions and implement appropriate safeguards. We do not share Owner contact details with Reporters through the alert history shown in the app.',
      ],
    },
    {
      id: 'retention',
      title: '9. Data retention',
      bullets: [
        'Account and vehicle data: retained while your account is active and for a reasonable period after deletion to resolve disputes and comply with law.',
        'Contact event logs: retained for operational, abuse-prevention, and legal purposes, typically up to 24 months unless a longer period is required.',
        'Support tickets: retained as long as needed to resolve your request and for follow-up.',
        'Technical logs: retained for a limited period appropriate for security monitoring.',
        'When data is no longer required, we delete or anonymise it in accordance with our retention practices.',
      ],
    },
    {
      id: 'security',
      title: '10. Security',
      paragraphs: [
        'We implement technical and organisational measures designed to protect personal data, including encryption of full licence plates at rest, access controls, and hashed identifiers for Reporter sessions.',
        'No method of transmission or storage is completely secure. While we strive to protect your data, we cannot guarantee absolute security.',
        'You are responsible for securing your mobile device and OTP access to your account.',
      ],
    },
    {
      id: 'rights',
      title: '11. Your rights',
      paragraphs: [
        'Subject to applicable law, including the DPDP Act, you may have the right to:',
      ],
      bullets: [
        'Access personal data we hold about you.',
        'Correct inaccurate or incomplete data (for example, via Profile settings).',
        'Withdraw consent where processing is consent-based (for example, marketing emails).',
        'Request erasure of your data, subject to legal retention requirements.',
        'Nominate another person to exercise rights on your behalf in certain circumstances.',
        'Grievance redressal through our contact channel or applicable authorities.',
      ],
      closingParagraphs: [
        'To exercise these rights, email support@parksafe.app. We may verify your identity before fulfilling requests.',
      ],
    },
    {
      id: 'children',
      title: '12. Children',
      paragraphs: [
        'The Service is not directed at children under 18. We do not knowingly collect personal data from children. If you believe we have collected data from a child, contact us and we will take appropriate steps to delete it.',
      ],
    },
    {
      id: 'cookies',
      title: '13. Cookies and similar technologies',
      bullets: [
        'We use essential cookies and local storage for authentication, session management, and security.',
        'We may use analytics cookies or similar technologies to understand how the Service is used. You can control non-essential cookies through your browser settings where applicable.',
        'We do not use cookies to track Reporters across unrelated websites for advertising.',
      ],
    },
    {
      id: 'international',
      title: '14. Cross-border processing',
      paragraphs: [
        'Our service providers may process data on servers located outside India. Where personal data is transferred internationally, we take steps required under applicable law to ensure appropriate safeguards.',
      ],
    },
    {
      id: 'third-party',
      title: '15. Third-party links',
      paragraphs: [
        'The Service may contain links to third-party websites (for example, purchasing QR tags). Their privacy practices are governed by their own policies. We encourage you to review them before providing personal data.',
      ],
    },
    {
      id: 'changes',
      title: '16. Changes to this Policy',
      paragraphs: [
        'We may update this Privacy Policy from time to time. We will post the revised Policy on this page and update the "Last updated" date. Material changes may be communicated through the Service or by email where appropriate.',
        'Continued use after changes take effect constitutes acknowledgment of the updated Policy.',
      ],
    },
    {
      id: 'grievance',
      title: '17. Grievance officer',
      paragraphs: [
        'In accordance with applicable Indian law, you may contact our grievance channel at support@parksafe.app for complaints regarding personal data processing. We will acknowledge and endeavour to resolve grievances within prescribed timelines.',
      ],
    },
    {
      id: 'contact',
      title: '18. Contact us',
      paragraphs: [
        'tribly tech pvt ltd',
        'Email: support@parksafe.app',
        'Website: https://parksafe.tribly.ai',
      ],
    },
  ],
} as const satisfies LegalDocumentMeta
