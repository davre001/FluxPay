import { createConfig } from 'wagmi'
import { http, defineChain } from 'viem'
import { porto } from 'porto/wagmi'

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

export const config = createConfig({
  chains: [morphHoodi],
  connectors: [porto()],
  transports: {
    [morphHoodi.id]: http('https://rpc-hoodi.morphl2.io'),
  },
  ssr: true,
})

export default config
