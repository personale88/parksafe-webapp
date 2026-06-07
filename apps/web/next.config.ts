import type { NextConfig } from 'next'
import createNextIntlPlugin from 'next-intl/plugin'

const withNextIntl = createNextIntlPlugin()

/**
 * apps/web/next.config.ts
 * Production-hardened Next.js 15 config.
 * Security headers, image optimisation, and CSP defined here.
 */
const isDev = process.env.NODE_ENV === 'development'
const apiOrigin = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'

const nextConfig: NextConfig = {
  reactStrictMode: true,

  async rewrites() {
    return [
      {
        source: '/backend/:path*',
        destination: `${apiOrigin}/:path*`,
      },
    ]
  },

  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://app.posthog.com",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: blob:",
              [
                "connect-src 'self'",
                'https://app.posthog.com',
                'https://graph.facebook.com',
                isDev ? apiOrigin : '',
              ]
                .filter(Boolean)
                .join(' '),
              "font-src 'self'",
              "frame-ancestors 'none'",
            ].join('; '),
          },
        ],
      },
    ]
  },

  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [], // No remote images in v1 — all assets are local
  },
}

export default withNextIntl(nextConfig)
