'use client';

import './globals.css'
import '@rainbow-me/rainbowkit/styles.css'
import { ReactNode } from 'react'
import { Toaster } from 'react-hot-toast'
import Navbar from '@/components/shared/Navbar'
import { WalletProvider } from '@/context/WalletContext'
import { useUserStore } from '@/stores/userStore'

function LayoutInner({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useUserStore()

  return (
    <div className="flex min-h-screen">
      <Navbar />
      <main className={`flex-1 min-h-screen ${isAuthenticated ? 'md:pl-0' : 'pt-16'}`}>
        {children}
      </main>
    </div>
  )
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <title>FluxPay — Creator-Brand Deal Escrow</title>
        <meta name="description" content="The escrow platform securing creator-brand deals with AI milestone verification and on-chain payments." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet" />
      </head>
      <body>
        <WalletProvider>
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#1e293b',
                color: '#e2e8f0',
                border: '1px solid rgba(124,58,237,0.3)',
                borderRadius: '12px',
                fontSize: '14px',
                fontWeight: '500',
              },
              success: { iconTheme: { primary: '#6ee7b7', secondary: '#0f172a' } },
              error: { iconTheme: { primary: '#fca5a5', secondary: '#0f172a' } },
            }}
          />
          <LayoutInner>{children}</LayoutInner>
        </WalletProvider>
      </body>
    </html>
  )
}
