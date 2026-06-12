import { mainnet, base, arbitrum, optimism, polygon, bsc, linea, scroll, baseSepolia } from 'viem/chains';

// Central chain registry — single source of truth for every chain the app can
// run on. Mainnets are the eight 1Shot-supported networks (USDC addresses come
// straight from 1Shot's getCapabilities). Base Sepolia stays for testing.
//
// Network selection:
//   NETWORK_MODE = mainnet (default) | testnet
//   ACTIVE_CHAIN_ID overrides the specific chain within that mode.
export type ChainDef = {
  id: number;
  name: string;
  isTestnet: boolean;
  viemChain: any;
  usdc: `0x${string}`;
  rpcUrl: string;
};

const rpc = (id: number, fallback: string) => process.env[`RPC_${id}`] || fallback;

export const CHAINS: ChainDef[] = [
  // ── Mainnets (1Shot-supported) ──
  { id: 1,      name: 'Ethereum',  isTestnet: false, viemChain: mainnet,  usdc: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48', rpcUrl: rpc(1, 'https://eth.llamarpc.com') },
  { id: 8453,   name: 'Base',      isTestnet: false, viemChain: base,     usdc: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', rpcUrl: rpc(8453, 'https://mainnet.base.org') },
  { id: 42161,  name: 'Arbitrum',  isTestnet: false, viemChain: arbitrum, usdc: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831', rpcUrl: rpc(42161, 'https://arb1.arbitrum.io/rpc') },
  { id: 10,     name: 'Optimism',  isTestnet: false, viemChain: optimism, usdc: '0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85', rpcUrl: rpc(10, 'https://mainnet.optimism.io') },
  { id: 137,    name: 'Polygon',   isTestnet: false, viemChain: polygon,  usdc: '0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359', rpcUrl: rpc(137, 'https://polygon-rpc.com') },
  { id: 56,     name: 'BNB Chain', isTestnet: false, viemChain: bsc,      usdc: '0x8ac76a51cc950d9822d68b83fe1ad97b32cd580d', rpcUrl: rpc(56, 'https://bsc-dataseed.binance.org') },
  { id: 59144,  name: 'Linea',     isTestnet: false, viemChain: linea,    usdc: '0x176211869cA2b568f2A7D4EE941E073a821EE1ff', rpcUrl: rpc(59144, 'https://rpc.linea.build') },
  { id: 534352, name: 'Scroll',    isTestnet: false, viemChain: scroll,   usdc: '0x06eFdBFf2a14a7c8E15944D1F4A48F9F95F663A4', rpcUrl: rpc(534352, 'https://rpc.scroll.io') },
  // ── Testnet (1Shot does NOT support testnets — direct redeem only) ──
  { id: 84532,  name: 'Base Sepolia', isTestnet: true, viemChain: baseSepolia, usdc: '0x036CbD53842c5426634e7929541eC2318f3dCF7e', rpcUrl: rpc(84532, 'https://sepolia.base.org') },
];

export const NETWORK_MODE = (process.env.NETWORK_MODE || 'mainnet').toLowerCase();
const DEFAULT_CHAIN_ID = NETWORK_MODE === 'testnet' ? 84532 : 8453;
export const ACTIVE_CHAIN_ID = Number(process.env.ACTIVE_CHAIN_ID || DEFAULT_CHAIN_ID);

export function getChain(id: number): ChainDef | undefined {
  return CHAINS.find((c) => c.id === id);
}

export const activeChain: ChainDef =
  getChain(ACTIVE_CHAIN_ID) || (getChain(DEFAULT_CHAIN_ID) as ChainDef);

export const isTestnetMode = () => activeChain.isTestnet;
export const mainnetChains = () => CHAINS.filter((c) => !c.isTestnet);
