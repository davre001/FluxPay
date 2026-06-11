import { createConfig, http } from 'wagmi'
import { mainnet } from 'wagmi/chains'

// NOTE: The live app does NOT define its chains here. Web3Auth's WagmiProvider
// (see context/WalletContext.tsx) builds the wagmi config automatically from the
// chains enabled in your MetaMask/Web3Auth dashboard, and exposes them to every
// wagmi hook. To add/remove a chain, change it in the dashboard — not in code.
//
// This standalone config exists ONLY so the legacy @wagmi/core helpers in
// utils/contracts.ts keep type-checking. It has no connectors and is not used
// by the live connected flow.
export const config = createConfig({
  chains: [mainnet],
  connectors: [],
  transports: {
    [mainnet.id]: http(),
  },
  ssr: true,
})

export default config
