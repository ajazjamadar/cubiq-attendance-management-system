/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false, // Helps with third-party map libraries in dev mode
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
};

module.exports = nextConfig;
