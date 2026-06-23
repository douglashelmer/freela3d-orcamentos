import type { NextConfig } from 'next'

const config: NextConfig = {
  serverExternalPackages: [
    '@prisma/client',
    '@prisma/adapter-pg',
    'pg',
    'bcryptjs',
  ],
  images: {
    remotePatterns: [{ protocol: 'https', hostname: '**' }],
  },
  webpack(webpackConfig, { isServer }) {
    if (!isServer) {
      // Prevent server-only modules from being bundled on the client
      webpackConfig.resolve = webpackConfig.resolve ?? {}
      webpackConfig.resolve.fallback = {
        ...webpackConfig.resolve.fallback,
        crypto: false,
        fs: false,
        net: false,
        tls: false,
        path: false,
        os: false,
        stream: false,
        buffer: false,
      }
    }
    return webpackConfig
  },
}

export default config
