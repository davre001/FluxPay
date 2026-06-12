export const config = {
  port: Number(process.env.PORT || 3000),
  nodeEnv: process.env.NODE_ENV || 'development',
  frontendUrl: process.env.FRONTEND_URL || '*',
  // Accept either name — the Neon connection string has shown up as both in env.
  databaseUrl: process.env.DATABASE_URL || process.env.POSTGREL_URL || '',
  ethereumRpcUrl: process.env.ETHEREUM_RPC_URL || '',
  contractAddress: process.env.CONTRACT_ADDRESS || '',

  // Testnet USDC faucet — sends a one-time $2 USDC welcome drip to a user's
  // wallet on first signup, used as their gas budget via the USDC paymaster.
  // Safe no-op when FAUCET_PRIVATE_KEY is unset. TESTNET ONLY — never put a
  // mainnet key here (it would hand out real money).
  faucet: {
    privateKey: process.env.FAUCET_PRIVATE_KEY || '',
    rpcUrl: process.env.BASE_SEPOLIA_RPC_URL || 'https://sepolia.base.org',
    // Circle's official testnet USDC on Base Sepolia (6 decimals).
    usdcAddress: process.env.FAUCET_USDC_ADDRESS || '0x036CbD53842c5426634e7929541eC2318f3dCF7e',
    dripUsdc: process.env.FAUCET_DRIP_USDC || '2',
  },

  // Web3Auth (MetaMask Embedded Wallets) — used to verify the idToken the
  // frontend sends. clientId checks the token's audience; leave empty to skip
  // that check (signature + expiry are always enforced).
  //
  // verificationKey: the project's static PEM public key from the dashboard
  // (Project Settings → Token verification). Preferred — verifies project-signed
  // tokens with no HTTP call. If unset, we fall back to the JWKS endpoint.
  web3auth: {
    clientId: process.env.WEB3AUTH_CLIENT_ID || '',
    verificationKey: (process.env.WEB3AUTH_VERIFICATION_KEY || '').replace(/\\n/g, '\n'),
    jwksEndpoint: process.env.JWKS_ENDPOINT || 'https://api-auth.web3auth.io/.well-known/jwks.json',
    // Accept either issuer (identity token vs session token).
    issuers: (process.env.WEB3AUTH_ISSUER || 'web3auth.io,https://api-auth.web3auth.io')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean),
    // DEVNET ONLY: Sapphire Devnet signs idTokens with rotating keys that are not
    // published on any reachable JWKS, so the signature can't be verified server-side.
    // When true, we still enforce audience + issuer + expiry, but skip the signature
    // check. MUST be false on mainnet (where api-auth.web3auth.io JWKS works).
    allowUnverifiedSignature: process.env.WEB3AUTH_ALLOW_UNVERIFIED === 'true',
  },
};

export function isProduction() {
  return config.nodeEnv === 'production';
}

