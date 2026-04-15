import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' },
          {
            key: 'Content-Security-Policy',
            value: "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline' https://*.vercel-scripts.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; img-src 'self' blob: data: https://ncfozqgrdfkbaexixzta.supabase.co https://*.supabase.co; font-src 'self' https://fonts.gstatic.com; connect-src 'self' https://ncfozqgrdfkbaexixzta.supabase.co https://*.supabase.co; worker-src 'self' blob:; frame-ancestors 'none';"
          },

        ],
      },
    ];
  },
};

export default nextConfig;
