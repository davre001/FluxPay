import type { Address } from 'viem'

// ── Multichain token registry ────────────────────────────────────────────────
// Each chain has a native currency (ETH, BNB, AVAX, CELO…) plus any number of
// ERC-20 tokens (USDC, USDT, DAI, WETH…). USDC is just the default settlement
// token for escrow — the model supports many tokens per chain. Decimals vary by
// token AND chain (e.g. USDC is 6 decimals on most chains but 18 on BNB).
//
// `address: 'native'` marks the chain's gas token (handled via wagmi useBalance,
// not a contract read).

export interface TokenInfo {
  symbol: string
  name: string
  address: Address | 'native'
  decimals: number
}

export interface ChainConfig {
  name: string
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
  // ── Mainnets ──
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
  43114: {
    name: 'Avalanche',
    nativeCurrency: { symbol: 'AVAX', name: 'Avalanche', decimals: 18 },
    tokens: [
      native('AVAX', 'Avalanche'),
      { symbol: 'USDC', name: 'USD Coin', address: '0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E', decimals: 6 },
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
  56: {
    name: 'BNB Smart Chain',
    nativeCurrency: { symbol: 'BNB', name: 'BNB', decimals: 18 },
    tokens: [
      native('BNB', 'BNB'),
      { symbol: 'USDC', name: 'USD Coin', address: '0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d', decimals: 18 },
      { symbol: 'USDT', name: 'Tether USD', address: '0x55d398326f99059fF775485246999027B3197955', decimals: 18 },
    ],
  },
  42220: {
    name: 'Celo',
    nativeCurrency: { symbol: 'CELO', name: 'Celo', decimals: 18 },
    tokens: [
      native('CELO', 'Celo'),
      { symbol: 'USDC', name: 'USD Coin', address: '0xcebA9300f2b948710d2653dD7B07f33A8B32118C', decimals: 6 },
    ],
  },

  // ── Testnets ──
  11155111: {
    name: 'Sepolia',
    nativeCurrency: { symbol: 'ETH', name: 'Ether', decimals: 18 },
    tokens: [
      native('ETH', 'Ether'),
      { symbol: 'USDC', name: 'USD Coin', address: '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238', decimals: 6 },
    ],
  },
  84532: {
    name: 'Base Sepolia',
    nativeCurrency: { symbol: 'ETH', name: 'Ether', decimals: 18 },
    tokens: [
      native('ETH', 'Ether'),
      { symbol: 'USDC', name: 'USD Coin', address: '0x036CbD53842c5426634e7929541eC2318f3dCF7e', decimals: 6 },
    ],
  },
  421614: {
    name: 'Arbitrum Sepolia',
    nativeCurrency: { symbol: 'ETH', name: 'Ether', decimals: 18 },
    tokens: [
      native('ETH', 'Ether'),
      { symbol: 'USDC', name: 'USD Coin', address: '0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d', decimals: 6 },
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

export const SUPPORTED_CHAIN_IDS = Object.keys(CHAINS).map(Number)
