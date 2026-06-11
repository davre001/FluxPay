import { WEB3AUTH_NETWORK } from '@web3auth/modal'
import type { Web3AuthContextConfig } from '@web3auth/modal/react'

// MetaMask Embedded Wallets (Web3Auth) configuration.
// `clientId` comes from your MetaMask / Web3Auth developer dashboard and is
// safe to expose to the browser. Keep CLIENT_SECRET on the backend only.
//
// web3AuthNetwork must match the network your dashboard project is set to.
// Use SAPPHIRE_DEVNET while testing, SAPPHIRE_MAINNET for production.

type Web3AuthOptions = Web3AuthContextConfig['web3AuthOptions']

// ── MetaMask smart account (Account Abstraction) ─────────────────────────────
// Each chain that should use the smart account needs a bundler URL (from your
// AA provider: Pimlico, ZeroDev, etc.). A chain with no bundler is simply left
// out of the AA config and falls back to the plain embedded EOA, so the app
// keeps working before you've provisioned bundlers.
//
// chainId is the hex form of the numeric id (e.g. 0x1 = Ethereum, 0x2105 = Base).
const BUNDLER_URLS: Record<string, string | undefined> = {
  '0x1': process.env.NEXT_PUBLIC_BUNDLER_ETHEREUM,
  '0x2105': process.env.NEXT_PUBLIC_BUNDLER_BASE,
  '0xa4b1': process.env.NEXT_PUBLIC_BUNDLER_ARBITRUM,
  '0xaa36a7': process.env.NEXT_PUBLIC_BUNDLER_SEPOLIA,
  '0x14a34': process.env.NEXT_PUBLIC_BUNDLER_BASE_SEPOLIA,
}

const aaChains = Object.entries(BUNDLER_URLS)
  .filter(([, url]) => Boolean(url))
  .map(([chainId, url]) => ({ chainId, bundlerConfig: { url: url as string } }))

const web3AuthOptions: Web3AuthOptions = {
  clientId: (process.env.NEXT_PUBLIC_CLIENT_ID || 'BPi5PB_UiIZt2w-CegcSDGCO8A_vEsYGYDG9Z42gZ3pQ4J1r-w18e7751a021a8309e4a81c4e7a898b3b5c') as string,
  web3AuthNetwork: WEB3AUTH_NETWORK.SAPPHIRE_DEVNET,
}

if (aaChains.length > 0) {
  web3AuthOptions.accountAbstractionConfig = {
    // MetaMask is the only smart-account type that supports EIP-7702 — the
    // modern standard that upgrades the user's EOA in place (vs. classic 4337).
    smartAccountType: 'metamask',
    smartAccountEipStandard: '7702',
    chains: aaChains,
  }
}

const web3AuthContextConfig: Web3AuthContextConfig = { web3AuthOptions }

export default web3AuthContextConfig
