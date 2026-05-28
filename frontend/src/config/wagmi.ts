import { getDefaultConfig } from '@rainbow-me/rainbowkit'
import { http } from 'viem'
import { morphHoodi } from 'viem/chains'

// Create custom Morph Hoodi chain if needed
const morphHoodiTestnet = {
  id: 2710,
  name: 'Morph Hoodi Testnet',
  nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
  rpcUrls: {
    default: { http: ['https://hoodi-sandbox.morphl2.io'] },
  },
  blockExplorers: {
    default: { name: 'Explorer', url: 'https://hoodi-sandbox.morphl2.io' },
  },
} as const

export const config = getDefaultConfig({
  appName: 'FluxPay',
  projectId: process.env.NEXT_PUBLIC_WALLET_PROJECT_ID || 'fluxpay-default',
  chains: [morphHoodiTestnet as any],
  transports: {
    [morphHoodiTestnet.id]: http('https://hoodi-sandbox.morphl2.io'),
  },
  ssr: true,
})
