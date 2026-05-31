'use client';

import './globals.css'
import '@rainbow-me/rainbowkit/styles.css'
import { ReactNode } from 'react'
import { Toaster } from 'react-hot-toast'
import Navbar from '@/components/shared/Navbar'
import { WalletProvider } from '@/context/WalletContext'

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <title>FluxPay - Data Collection Platform</title>
        <meta name="description" content="Pay for verified data outcomes" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body>
        <WalletProvider>
          <Toaster
            position="top-right"
            reverseOrder={false}
            gutter={8}
            toastOptions={{
              duration: 4000,
              style: {
                background: '#fff',
                color: '#000',
              },
              success: {
                style: {
                  background: '#10b981',
                  color: '#fff',
                },
              },
              error: {
                style: {
                  background: '#ef4444',
                  color: '#fff',
                },
              },
            }}
          />
          <Navbar />
          <main className="container-custom py-8">
            {children}
          </main>
        </WalletProvider>
      </body>
    </html>
  )
}
