/** @type {import('next').NextConfig} */
const path = require('path')

const solanaShim = path.resolve(__dirname, 'src/lib/solana-shim.js')

const nextConfig = {
  reactStrictMode: true,
  images: {
    unoptimized: true,
  },
  webpack: (config) => {
    // Shim out Solana Kit packages that @web3auth/modal pulls in transitively.
    // The app only uses Web3Auth's EVM (wagmi) side; Solana code paths are
    // never reached at runtime.  The shim provides no-op functions so that
    // module-level initialisation in @web3auth/modal doesn't crash during
    // Next.js static generation / SSR.
    config.resolve.alias = {
      ...config.resolve.alias,
      '@solana/react-hooks': solanaShim,
      '@solana/sysvars': solanaShim,
      '@solana/accounts': solanaShim,
      '@solana/addresses': solanaShim,
      '@solana/keys': solanaShim,
      '@solana/programs': solanaShim,
      '@solana/rpc': solanaShim,
      '@solana/transactions': solanaShim,
    }
    return config
  },
};

module.exports = nextConfig;

