import './globals.css'
import { ReactNode } from 'react'
import { WalletProvider } from '@/context/WalletContext'
import ClientLayout from './client-layout'

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
