/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['localhost'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.supabase.co',
      },
    ],
  },
  // Optimize for Vercel deployment
  experimental: {
    serverActions: {
      bodySizeLimit: '20mb', // Increased for large transcript uploads
    },
  },
}

module.exports = nextConfig

