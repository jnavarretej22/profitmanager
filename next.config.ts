import type { NextConfig } from "next"

const securityHeaders = [
  { key: "X-Frame-Options",           value: "DENY" },
  { key: "X-Content-Type-Options",    value: "nosniff" },
  { key: "X-XSS-Protection",          value: "1; mode=block" },
  { key: "Referrer-Policy",           value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy",        value: "camera=(), microphone=(), geolocation=()" },
  {
    key:   "Strict-Transport-Security",
    value: "max-age=31536000; includeSubDomains; preload",
  },
  {
    key:   "Content-Security-Policy",
    // Permite inline styles (necesario para react-pdf y recharts), Google APIs para Meet
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-eval' 'unsafe-inline'",   // Next.js requiere unsafe-eval en dev
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      "img-src 'self' data: blob: https:",
      "connect-src 'self' https://api.resend.com https://*.googleapis.com",
      "frame-src 'none'",
      "object-src 'none'",
      "base-uri 'self'",
    ].join("; "),
  },
]

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
    ]
  },

  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**.amazonaws.com"   },
      { protocol: "https", hostname: "**.cloudflare.com"  },
      { protocol: "https", hostname: "**.supabase.co"     },
      { protocol: "https", hostname: "**.neon.tech"       },
    ],
  },

}

export default nextConfig
