'use client';

import { ReactNode } from 'react'
import { Toaster } from 'react-hot-toast'
import Navbar from '@/components/shared/Navbar'
import { useUserStore } from '@/stores/userStore'
import { usePathname } from 'next/navigation'

export default function ClientLayout({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useUserStore()
  const pathname = usePathname()
  const isOnboarding = pathname?.startsWith('/onboarding')
  const isLandingPage = pathname === '/'
  const needsTopPad = !isAuthenticated || isOnboarding || isLandingPage

  return (
    <>
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
      <div className="flex min-h-screen">
        <Navbar />
        <main className={`flex-1 min-h-screen ${needsTopPad ? 'pt-16' : 'md:pl-0'}`}>
          {children}
        </main>
      </div>
    </>
  )
}
