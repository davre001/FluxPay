import './globals.css'
import { ReactNode } from 'react'
import dynamic from 'next/dynamic'
import ClientLayout from './client-layout'

// Web3Auth's SolanaProvider imports @solana/* packages at module level.
// Those are stubbed to `false` in next.config.js (they're unused transitive
// deps), which works in the browser but crashes during Next.js static
// generation / SSR.  Loading the entire provider tree client-only avoids this.
const WalletProvider = dynamic(
  () => import('@/context/WalletContext').then((m) => m.WalletProvider),
  { ssr: false },
)

export const metadata = {
  title: 'FluxPay — Creator-Brand Deal Escrow',
  description: 'The escrow platform securing creator-brand deals with AI milestone verification and on-chain payments.',
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet" />
      </head>
      <body>
        <WalletProvider>
          <ClientLayout>{children}</ClientLayout>
        </WalletProvider>
      </body>
    </html>
  )
}
