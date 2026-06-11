/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['porto'],
  images: {
    unoptimized: true,
  },
};

module.exports = nextConfig;
