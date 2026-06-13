import type { Address } from 'viem'

// ── Chain registry (single source of truth on the frontend) ──────────────────
// Mirrors the backend registry at backend/src/config/chains.ts: the eight
// 1Shot-supported mainnets plus Base Sepolia for testing. Only chains FluxPay
// can actually settle on belong here — never add a chain 1Shot doesn't support.
//
// Each chain has a native currency (ETH, BNB, POL…) plus any number of ERC-20
// tokens. USDC is the default settlement token for escrow; the model supports
// many tokens per chain. Decimals vary by token AND chain (USDC is 6 decimals on
// most chains but 18 on BNB Chain). `address: 'native'` marks the gas token
// (read via wagmi useBalance, not a contract call).

export interface TokenInfo {
  symbol: string
  name: string
  address: Address | 'native'
  decimals: number
}

export interface ChainConfig {
  name: string
  isTestnet?: boolean
  nativeCurrency: { symbol: string; name: string; decimals: number }
  tokens: TokenInfo[]
  escrowFactory?: Address // FluxPay escrow — set once deployed on that chain
}

const native = (symbol: string, name: string, decimals = 18): TokenInfo => ({
  symbol,
  name,
  address: 'native',
  decimals,
})

export const CHAINS: Record<number, ChainConfig> = {
  // ── Mainnets (1Shot-supported) — USDC addresses match the backend registry ──
  1: {
    name: 'Ethereum',
    nativeCurrency: { symbol: 'ETH', name: 'Ether', decimals: 18 },
    tokens: [
      native('ETH', 'Ether'),
      { symbol: 'USDC', name: 'USD Coin', address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', decimals: 6 },
      { symbol: 'USDT', name: 'Tether USD', address: '0xdAC17F958D2ee523a2206206994597C13D831ec7', decimals: 6 },
      { symbol: 'DAI', name: 'Dai Stablecoin', address: '0x6B175474E89094C44Da98b954EedeAC495271d0F', decimals: 18 },
      { symbol: 'WETH', name: 'Wrapped Ether', address: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2', decimals: 18 },
    ],
  },
  8453: {
    name: 'Base',
    nativeCurrency: { symbol: 'ETH', name: 'Ether', decimals: 18 },
    tokens: [
      native('ETH', 'Ether'),
      { symbol: 'USDC', name: 'USD Coin', address: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', decimals: 6 },
      { symbol: 'DAI', name: 'Dai Stablecoin', address: '0x50c5725949A6F0c72E6C4a641F24049A917DB0Cb', decimals: 18 },
    ],
  },
  42161: {
    name: 'Arbitrum One',
    nativeCurrency: { symbol: 'ETH', name: 'Ether', decimals: 18 },
    tokens: [
      native('ETH', 'Ether'),
      { symbol: 'USDC', name: 'USD Coin', address: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831', decimals: 6 },
      { symbol: 'USDT', name: 'Tether USD', address: '0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9', decimals: 6 },
      { symbol: 'ARB', name: 'Arbitrum', address: '0x912CE59144191C1204E64559FE8253a0e49E6548', decimals: 18 },
    ],
  },
  10: {
    name: 'Optimism',
    nativeCurrency: { symbol: 'ETH', name: 'Ether', decimals: 18 },
    tokens: [
      native('ETH', 'Ether'),
      { symbol: 'USDC', name: 'USD Coin', address: '0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85', decimals: 6 },
    ],
  },
  137: {
    name: 'Polygon',
    nativeCurrency: { symbol: 'POL', name: 'Polygon', decimals: 18 },
    tokens: [
      native('POL', 'Polygon'),
      { symbol: 'USDC', name: 'USD Coin', address: '0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359', decimals: 6 },
    ],
  },
  56: {
    name: 'BNB Smart Chain',
    nativeCurrency: { symbol: 'BNB', name: 'BNB', decimals: 18 },
    tokens: [
      native('BNB', 'BNB'),
      // NOTE: USDC on BNB Chain is 18 decimals (not 6) — Binance-Peg token.
      { symbol: 'USDC', name: 'USD Coin', address: '0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d', decimals: 18 },
      { symbol: 'USDT', name: 'Tether USD', address: '0x55d398326f99059fF775485246999027B3197955', decimals: 18 },
    ],
  },
  59144: {
    name: 'Linea',
    nativeCurrency: { symbol: 'ETH', name: 'Ether', decimals: 18 },
    tokens: [
      native('ETH', 'Ether'),
      { symbol: 'USDC', name: 'USD Coin', address: '0x176211869cA2b568f2A7D4EE941E073a821EE1ff', decimals: 6 },
    ],
  },
  534352: {
    name: 'Scroll',
    nativeCurrency: { symbol: 'ETH', name: 'Ether', decimals: 18 },
    tokens: [
      native('ETH', 'Ether'),
      { symbol: 'USDC', name: 'USD Coin', address: '0x06eFdBFf2a14a7c8E15944D1F4A48F9F95F663A4', decimals: 6 },
    ],
  },

  // ── Testnet (1Shot has no testnet support → direct-redeem path) ──
  84532: {
    name: 'Base Sepolia',
    isTestnet: true,
    nativeCurrency: { symbol: 'ETH', name: 'Ether', decimals: 18 },
    tokens: [
      native('ETH', 'Ether'),
      { symbol: 'USDC', name: 'USD Coin', address: '0x036CbD53842c5426634e7929541eC2318f3dCF7e', decimals: 6 },
    ],
  },
}

export function getChainConfig(chainId?: number): ChainConfig | undefined {
  return chainId ? CHAINS[chainId] : undefined
}

// All tokens available on a chain (native + ERC-20s).
export function getTokens(chainId?: number): TokenInfo[] {
  return getChainConfig(chainId)?.tokens ?? []
}

// A specific token by symbol on a chain (e.g. getToken(8453, 'USDC')).
export function getToken(chainId: number | undefined, symbol: string): TokenInfo | undefined {
  return getTokens(chainId).find((t) => t.symbol.toLowerCase() === symbol.toLowerCase())
}

// Only the ERC-20 tokens (excludes the native gas token).
export function getErc20Tokens(chainId?: number): TokenInfo[] {
  return getTokens(chainId).filter((t) => t.address !== 'native')
}

export function getEscrowFactory(chainId?: number): Address | undefined {
  return getChainConfig(chainId)?.escrowFactory
}

export function isChainSupported(chainId?: number): boolean {
  return !!chainId && chainId in CHAINS
}

// ── Settlement set — mirrors backend/src/config/chains.ts ─────────────────────
// The eight 1Shot mainnets settle via the 1Shot relayer; Base Sepolia settles
// via direct redeem. Gate any escrow / permission / settlement UI on these.
export const MAINNET_CHAIN_IDS = [1, 8453, 42161, 10, 137, 56, 59144, 534352] as const
export const TESTNET_CHAIN_IDS = [84532] as const
export const SETTLEMENT_CHAIN_IDS: number[] = [...MAINNET_CHAIN_IDS, ...TESTNET_CHAIN_IDS]
export const SUPPORTED_CHAIN_IDS = Object.keys(CHAINS).map(Number)

export function isMainnetChain(chainId?: number): boolean {
  return !!chainId && (MAINNET_CHAIN_IDS as readonly number[]).includes(chainId)
}

export function isSettlementChain(chainId?: number): boolean {
  return !!chainId && SETTLEMENT_CHAIN_IDS.includes(chainId)
}
