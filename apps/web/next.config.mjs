/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: [
    '@bnb/ui',
    '@bnb/features',
    '@bnb/api',
    '@bnb/utils',
    '@bnb/db',
    'nativewind',
    'react-native',
    'react-native-web',
    'react-native-css-interop',
    'lucide-react-native',
    'expo-router',
    'expo-modules-core',
  ],
  webpack: (config) => {
    config.resolve.alias = {
      ...(config.resolve.alias ?? {}),
      'react-native$': 'react-native-web',
    };
    config.resolve.extensions = [
      '.web.tsx',
      '.web.ts',
      '.web.jsx',
      '.web.js',
      ...config.resolve.extensions,
    ];
    return config;
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'a0.muscache.com' },
    ],
  },
  // Production security headers, including a Content-Security-Policy scoped to
  // the origins this app actually uses (tested against home / listing / map /
  // FAQ). script-src is locked to same-origin — 'unsafe-inline'/'unsafe-eval'
  // are required by Next's inline bootstrap + react-native-web/nativewind +
  // maplibre-gl; the value of script-src 'self' here is blocking *external*
  // script hosts. style 'unsafe-inline' is required by RN-web/nativewind +
  // maplibre injected styles.
  async headers() {
    const csp = [
      "default-src 'self'",
      "base-uri 'self'",
      "object-src 'none'",
      "frame-ancestors 'self'",
      "form-action 'self'",
      "img-src 'self' data: blob: https:",
      "font-src 'self' data:",
      "style-src 'self' 'unsafe-inline'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      "worker-src 'self' blob:",
      "manifest-src 'self'",
      "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://tiles.openfreemap.org",
      'upgrade-insecure-requests',
    ].join('; ');
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'Content-Security-Policy', value: csp },
          { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'X-DNS-Prefetch-Control', value: 'on' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), payment=(), geolocation=(self)' },
        ],
      },
    ];
  },
};

export default nextConfig;
