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

export const config = getDefaultConfig({
  appName: 'FluxPay',
  projectId: process.env.NEXT_PUBLIC_WALLET_PROJECT_ID || 'fluxpay-default',
  chains: [morphHoodi],
  transports: {
    [morphHoodi.id]: http('https://rpc-hoodi.morphl2.io'),
  },
  ssr: true,
})

export default config
