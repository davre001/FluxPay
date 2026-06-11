'use client';

import { ReactNode } from 'react'
import { QueryClientProvider, QueryClient } from '@tanstack/react-query'
import { Web3AuthProvider } from '@web3auth/modal/react'
import { WagmiProvider } from '@web3auth/modal/react/wagmi'
import web3AuthContextConfig from '@/config/web3authContext'

const queryClient = new QueryClient()

// Provider order matters: Web3AuthProvider must wrap everything so the SDK
// context is available. WagmiProvider serves the EVM chains.
// NOTE: SolanaProvider was removed because the underlying @solana/* packages
// are shimmed (not installed). Solana wallet features are disabled until the
// full Solana Kit dependency tree is added.
export function WalletProvider({ children }: { children: ReactNode }) {
  return (
    <Web3AuthProvider config={web3AuthContextConfig}>
      <QueryClientProvider client={queryClient}>
        <WagmiProvider>
          {children}
        </WagmiProvider>
      </QueryClientProvider>
    </Web3AuthProvider>
  )
}

