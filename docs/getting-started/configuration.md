---
description: Set up environment variables for frontend and backend.
---

# Configuration

## Frontend — `frontend/.env.local`

Copy the example and fill in your values:

```bash
cp frontend/.env.example frontend/.env.local
```

```env
# Backend API
NEXT_PUBLIC_API_URL=http://localhost:8000

# Web3Auth (MetaMask Embedded Wallets)
NEXT_PUBLIC_CLIENT_ID=<your Web3Auth client ID from dashboard>

# Deployed contract addresses (already set for Hoodi testnet)
NEXT_PUBLIC_ESCROW_FACTORY_ADDRESS=0x58B92620Ce2Fa3dD61f0143Ea4f1bbF961130856
NEXT_PUBLIC_USDC_ADDRESS=0x2CeF50c5C6059F43180b1d91EFA354A9A837AdE1

# Optional: AA bundler URLs (one per chain you want smart accounts on)
NEXT_PUBLIC_BUNDLER_SEPOLIA=https://...
NEXT_PUBLIC_BUNDLER_BASE=https://...

# Optional: Paymaster URLs (sponsored gas — zero gas for users)
NEXT_PUBLIC_PAYMASTER_SEPOLIA=https://...
NEXT_PUBLIC_PAYMASTER_BASE=https://...
```

## Backend — `backend/.env`

```env
PORT=8000
NODE_ENV=development

# Your frontend URL (for CORS)
FRONTEND_URL=http://localhost:3000

# Web3Auth — must match the clientId in the frontend
WEB3AUTH_CLIENT_ID=<your Web3Auth client ID>
JWKS_ENDPOINT=https://api-auth.web3auth.io/.well-known/jwks.json
WEB3AUTH_ALLOW_UNVERIFIED=true  # true for Sapphire Devnet only

# Optional: Postgres (falls back to in-memory if unset)
DATABASE_URL=postgres://...

# Optional: Chain selection
NETWORK_MODE=testnet
ACTIVE_CHAIN_ID=84532

# Optional: AI verification
VENICE_API_KEY=<your Venice API key>

# Optional: USDC faucet (testnet)
FAUCET_PRIVATE_KEY=<funded wallet private key>
```

{% hint style="warning" %}
**Never commit `.env` files.** Use `.env.example` as templates. The `.gitignore` already excludes them.
{% endhint %}

{% hint style="info" %}
See the full [Environment Variables](../reference/environment-variables.md) reference for all 35+ available variables.
{% endhint %}
