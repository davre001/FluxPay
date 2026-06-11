export const config = {
  port: Number(process.env.PORT || 3000),
  nodeEnv: process.env.NODE_ENV || 'development',
  frontendUrl: process.env.FRONTEND_URL || '*',
  databaseUrl: process.env.DATABASE_URL || '',
  ethereumRpcUrl: process.env.ETHEREUM_RPC_URL || '',
  contractAddress: process.env.CONTRACT_ADDRESS || '',

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
  },
};

export function isProduction() {
  return config.nodeEnv === 'production';
}

