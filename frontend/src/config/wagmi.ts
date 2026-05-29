import { getDefaultConfig } from '@rainbow-me/rainbowkit'
import { http, defineChain } from 'viem'

// Define Morph Hoodi testnet chain
export const morphHoodi = defineChain({
  id: 2910,
  name: 'Morph Hoodi',
  nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
  rpcUrls: {
    default: { http: ['https://rpc-hoodi.morphl2.io'] },
  },
  blockExplorers: {
    default: { name: 'Morph Explorer', url: 'https://explorer-hoodi.morphl2.io' },
  },
  testnet: true,
})

export const CONTRACTS = {
  usdc: '0x2CeF50c5C6059F43180b1d91EFA354A9A837AdE1',
  escrowFactory: '0x58B92620Ce2Fa3dD61f0143Ea4f1bbF961130856',
} as const

export const config = getDefaultConfig({
  appName: 'FluxPay',
  projectId: process.env.NEXT_PUBLIC_WALLET_PROJECT_ID || 'fluxpay-default',
  chains: [morphHoodi],
  transports: {
    [morphHoodi.id]: http('https://rpc-hoodi.morphl2.io'),
  },
  ssr: true,
})
