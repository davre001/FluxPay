import { activeChain, isTestnetMode } from './chains.ts';

export const config = {
  port: Number(process.env.PORT || 8000),
  nodeEnv: process.env.NODE_ENV || 'development',
  frontendUrl: process.env.FRONTEND_URL || '*',
  // Accept either name — the Neon connection string has shown up as both in env.
  databaseUrl: process.env.DATABASE_URL || process.env.POSTGREL_URL || '',
  ethereumRpcUrl: process.env.ETHEREUM_RPC_URL || '',
  contractAddress: process.env.CONTRACT_ADDRESS || '',

  // The active chain everything runs on (see config/chains.ts). Mainnet by
  // default; flip with NETWORK_MODE=testnet (Base Sepolia) or ACTIVE_CHAIN_ID.
  chain: activeChain,

  // USDC faucet — one-time $2 welcome drip on first signup. TESTNET ONLY: it
  // hands out free USDC, which makes no sense on mainnet, so it's force-disabled
  // unless the active chain is a testnet. Safe no-op when FAUCET_PRIVATE_KEY unset.
  faucet: {
    privateKey: process.env.FAUCET_PRIVATE_KEY || '',
    rpcUrl: activeChain.rpcUrl,
    usdcAddress: activeChain.usdc,
    dripUsdc: process.env.FAUCET_DRIP_USDC || '2',
    enabledForChain: isTestnetMode(), // never drip free USDC on mainnet
  },

  // Social OAuth — creators "Connect" a YouTube/X account so we can snapshot the
  // real handle + follower count + verified flag + account age (no screenshots).
  // Instagram/TikTok are deferred (link-only). Each provider is enabled only when
  // its client id/secret are set; otherwise connect returns a clear "not configured".
  // OAUTH_CALLBACK_URL is the frontend page that receives ?code&state and POSTs
  // them back to /api/profile/socials/:platform/callback.
  oauth: {
    callbackUrl: process.env.OAUTH_CALLBACK_URL || `${process.env.FRONTEND_URL || 'http://localhost:3000'}/social/callback`,
    youtube: {
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    },
    // X / Twitter: must be the **OAuth 2.0 Client ID / Client Secret** (NOT the
    // OAuth 1.0a API Key/Secret). Accepts several env names for convenience.
    twitter: {
      clientId: process.env.TWITTER_CLIENT_ID || process.env.X_CLIENT_ID || process.env.X_API_KEY || '',
      clientSecret: process.env.TWITTER_CLIENT_SECRET || process.env.X_CLIENT_SECRET || process.env.X_API_SECRET || '',
    },
  },

  // The on-chain "agent" that redeems brand-granted ERC-7715 permissions to pay
  // creators (ERC-7710). Same wallet as the faucet by default — set a separate
  // AGENT_PRIVATE_KEY only if you split the roles. Chain-driven. No-op when unset.
  agent: {
    privateKey: process.env.AGENT_PRIVATE_KEY || process.env.FAUCET_PRIVATE_KEY || '',
    rpcUrl: activeChain.rpcUrl,
    chainId: activeChain.id,
    usdcAddress: activeChain.usdc,
  },

  // A2A: the "settlement" agent that the platform agent redelegates a narrowed,
  // per-job permission to. It does the actual USDC release, so a leak of its key
  // is capped at the redelegated amount — not the brand's full grant.
  settlement: {
    privateKey: process.env.SETTLEMENT_AGENT_PRIVATE_KEY || '',
  },

  // Venice AI — verifies creator deliverables against the job brief. Venice's
  // API is OpenAI-compatible (chat/completions). Safe no-op when unset. Use a
  // vision-capable model so image deliverables can be judged.
  venice: {
    apiKey: process.env.VENICE_API_KEY || '',
    baseUrl: process.env.VENICE_BASE_URL || 'https://api.venice.ai/api/v1',
    // Confirmed, vision-capable model. Override via VENICE_MODEL; list options
    // with GET {baseUrl}/models.
    model: process.env.VENICE_MODEL || 'claude-opus-4-8',
  },

  // Gemini AI — testing-only fallback when Venice is unavailable. Same
  // OpenAI-compatible chat/completions interface. Set GEMINI_API_KEY to enable;
  // Venice takes priority when both are set.
  gemini: {
    apiKey: process.env.GEMINI_API_KEY || '',
    baseUrl: process.env.GEMINI_BASE_URL || 'https://generativelanguage.googleapis.com/v1beta/openai',
    model: process.env.GEMINI_MODEL || 'gemini-2.5-flash',
  },

  // 1Shot permissionless relayer — relays ERC-7710 redemptions and pays gas in
  // a stablecoin (USDC). Permissionless: no API key. MAINNET ONLY (testnets
  // return empty capabilities), so this is the mainnet payout rail. The fee
  // token is NOT hardcoded — RelayerService picks USDC from getCapabilities.
  oneshot: {
    endpoint: process.env.ONESHOT_RELAYER_URL || 'https://relayer.1shotapi.com/relayers',
    // Defaults to the active chain when it's a mainnet; falls back to Base
    // mainnet on testnet (1Shot can't relay on testnets anyway).
    chainId: Number(process.env.ONESHOT_CHAIN_ID || (isTestnetMode() ? 8453 : activeChain.id)),
    // Demo aid: when true, the relay path assembles the REAL 7710 payload and
    // fetches a REAL gas-in-USDC fee quote, but returns a clearly-labelled
    // *simulated* result instead of broadcasting — so judges see the full
    // mainnet 1Shot UX on testnet without spending. Auto-on in demo/testnet.
    simulate: (process.env.ONESHOT_SIMULATE || (isTestnetMode() ? 'true' : 'false')).toLowerCase() === 'true',
  },

  // Demo mode: enables judge-facing affordances + the seeded demo deal. Never
  // bypasses auth — sign-in stays real Web3Auth.
  demo: {
    enabled: (process.env.DEMO_MODE || (isTestnetMode() ? 'true' : 'false')).toLowerCase() === 'true',
    // Secret that unlocks the hidden presenter control. Lives ONLY here (server
    // env, gitignored) — never shipped to the client, so reading the frontend or
    // backend source can't reveal it. Empty = no gate (local dev convenience).
    unlockCode: process.env.DEMO_UNLOCK_CODE || '',
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

