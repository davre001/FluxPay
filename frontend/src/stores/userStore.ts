import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type ProfileType = 'creator' | 'organization' | null

interface AuthUser {
  id: string
  email: string
  profileType: ProfileType
  walletAddress?: string
}

interface UserStore {
  user: AuthUser | null
  token: string | null
  isAuthenticated: boolean

  // Actions
  setAuth: (user: AuthUser, token: string) => void
  logout: () => void
  updateWallet: (address: string) => void
}

export const useUserStore = create<UserStore>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,

      setAuth: (user, token) => {
        if (typeof window !== 'undefined') {
          localStorage.setItem('auth_token', token)
        }
        set({ user, token, isAuthenticated: true })
      },

      logout: () => {
        if (typeof window !== 'undefined') {
          localStorage.removeItem('auth_token')
        }
        set({ user: null, token: null, isAuthenticated: false })
      },

      updateWallet: (address) =>
        set((state) => ({
          user: state.user ? { ...state.user, walletAddress: address } : null,
        })),
    }),
    {
      name: 'fluxpay-user',
      partialize: (s) => ({ user: s.user, token: s.token, isAuthenticated: s.isAuthenticated }),
    }
  )
)
