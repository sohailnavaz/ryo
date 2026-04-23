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
};

export default nextConfig;
