'use client';

import { ReactNode } from 'react'
import { QueryClientProvider, QueryClient } from '@tanstack/react-query'
import { Web3AuthProvider } from '@web3auth/modal/react'
import { WagmiProvider } from '@web3auth/modal/react/wagmi'
import { SolanaProvider } from '@web3auth/modal/react/solana'
import web3AuthContextConfig from '@/config/web3authContext'

const queryClient = new QueryClient()

// Provider order matters: Web3AuthProvider must wrap everything so the SDK
// context is available. WagmiProvider serves the EVM chains and SolanaProvider
// serves the non-EVM (Solana) chains — both are driven by the same Web3Auth
// login, so the user picks any chain from one modal.
export function WalletProvider({ children }: { children: ReactNode }) {
  return (
    <Web3AuthProvider config={web3AuthContextConfig}>
      <QueryClientProvider client={queryClient}>
        <WagmiProvider>
          <SolanaProvider>
            {children}
          </SolanaProvider>
        </WagmiProvider>
      </QueryClientProvider>
    </Web3AuthProvider>
  )
}
