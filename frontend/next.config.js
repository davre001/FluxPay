/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    unoptimized: true,
  },
  webpack: (config) => {
    // Stub out Solana packages that get pulled in transitively
    // but are never actually used at runtime in this app.
    config.resolve.alias = {
      ...config.resolve.alias,
      '@solana/react-hooks': false,
      '@solana/sysvars': false,
      '@solana/accounts': false,
      '@solana/addresses': false,
      '@solana/keys': false,
      '@solana/programs': false,
      '@solana/rpc': false,
      '@solana/transactions': false,
    }
    return config
  },
};

module.exports = nextConfig;
